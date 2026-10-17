// Build web + deploy na Vercel.
// 1) A Vercel descarta pastas "node_modules" no upload, e o Expo coloca fontes/ícones em
//    dist/assets/node_modules: renomeia para "vendor" e reescreve as referências.
// 2) Transforma o site em PWA: depois de aberto uma vez com internet, abre sem internet
//    (necessário para o link do SMS funcionar offline).
import { execSync } from 'node:child_process';
import { copyFileSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const run = (cmd, cwd) => execSync(cmd, { stdio: 'inherit', cwd });

rmSync('dist', { recursive: true, force: true });
run('npx expo export -p web');

renameSync('dist/assets/node_modules', 'dist/assets/vendor');

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
for (const f of walk('dist').filter((p) => /\.(js|html|json)$/.test(p))) {
  const src = readFileSync(f, 'utf8');
  if (src.includes('assets/node_modules')) writeFileSync(f, src.replaceAll('assets/node_modules', 'assets/vendor'));
}

// ---- PWA ----
copyFileSync('assets/icon.png', 'dist/icon.png');
writeFileSync('dist/manifest.json', JSON.stringify({
  name: 'Arena Connect', short_name: 'Arena Connect', start_url: '/', display: 'standalone',
  background_color: '#f4f6f9', theme_color: '#1762c4', lang: 'pt-BR',
  icons: [{ src: '/icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' }],
}, null, 2));

// Só o necessário para abrir offline (o Expo exporta todas as fontes de ícones; usamos Feather e 3 pesos da Inter).
const needed = (p) =>
  /\.(js|html|ico|png|json)$/.test(p) || /Feather\.|Inter_(400Regular|600SemiBold|700Bold)\./.test(p);
const files = walk('dist').map((p) => `/${relative('dist', p).split(sep).join('/')}`).filter(needed);
const version = Date.now().toString(36);
writeFileSync('dist/sw.js', `// Gerado por scripts/deploy-web.mjs
const CACHE = 'arena-connect-${version}';
const FILES = ${JSON.stringify(['/', ...files])};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Página: tenta a rede (versão nova); sem internet, abre a cópia salva (o ?u= do SMS é preservado na URL).
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() =>
      caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('/index.html')).then((r) => r || caches.match('/'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});
`);

const html = readFileSync('dist/index.html', 'utf8')
  .replace('</head>', '<link rel="manifest" href="/manifest.json"><meta name="theme-color" content="#1762c4"><link rel="apple-touch-icon" href="/icon.png"></head>')
  .replace('</body>', `<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}</script></body>`);
writeFileSync('dist/index.html', html);

if (process.argv.includes('--prod')) run('npx vercel deploy --prod --yes --name arena-connect-prototipo', 'dist');
