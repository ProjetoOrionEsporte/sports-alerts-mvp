// Build web + deploy na Vercel.
// A Vercel descarta pastas "node_modules" no upload, e o Expo coloca fontes/ícones em
// dist/assets/node_modules. Renomeia para "vendor" e reescreve as referências.
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

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

if (process.argv.includes('--prod')) run('npx vercel deploy --prod --yes --name arena-connect-prototipo', 'dist');
