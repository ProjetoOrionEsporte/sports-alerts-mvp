import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Game, Notice, Priority, SmsRequest, User, coaches, seedGames, seedNotices, teamName, teams, NOW,
} from './data';
import { buildChangeSms, parseChangeSms } from './sms';

interface Snapshot { games: Game[]; notices: Notice[]; lastSync: string | null }

interface GameChange { date: string; time: string; venue: string; note: string; priority: Priority }

export type SmsStatus = 'unavailable' | 'on' | 'denied';

interface Store {
  user: User | null;
  ready: boolean;
  online: boolean;
  setOnline: (v: boolean) => void;
  login: (u: User) => void;
  logout: () => void;
  // dados visíveis ao usuário atual (admin: servidor; demais: cópia local)
  games: Game[];
  notices: Notice[];
  sms: SmsRequest[];
  lastSync: string | null;
  syncing: boolean;
  syncError: string | null;
  sync: () => Promise<void>;
  hasPending: boolean; // servidor tem versão mais nova que a cópia local
  publishChange: (gameId: string, c: GameChange) => { ok: boolean; error?: string };
  publishNotice: (n: { title: string; body: string; priority: Priority; target: 'all' | string[] }) => { ok: boolean; error?: string };
  retrySms: (id: string) => void;
  markSmsChip: (id: string, s: NonNullable<SmsRequest['chip']>) => void;
  // atualização offline por SMS (atleta/professor)
  applySms: (raw: string) => 'applied' | 'duplicate' | 'invalid' | 'unknown-game';
  smsUpdate: string | null;
  dismissSmsUpdate: () => void;
  smsStatus: SmsStatus;
  setSmsStatus: (s: SmsStatus) => void;
}

const Ctx = createContext<Store>(null as unknown as Store);
export const useStore = () => useContext(Ctx);

const STORAGE_KEY = 'arena-connect:v1';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const brDate = (iso: string) => iso.split('-').reverse().join('/');

/** Texto do aviso automático de alteração de jogo (usado no servidor e ao aplicar um SMS). */
function changeNotice(before: Pick<Game, 'date' | 'time' | 'venue'>, after: Game, note?: string) {
  const parts: string[] = [];
  if (before.time !== after.time || before.date !== after.date) {
    parts.push(`horário: ${before.date === after.date ? '' : `${brDate(before.date)} `}${before.time.replace(':', 'h')} → ${after.date === before.date ? '' : `${brDate(after.date)} `}${after.time.replace(':', 'h')}`);
  }
  if (before.venue !== after.venue) parts.push(`local: ${before.venue} → ${after.venue}`);
  return {
    title: `Jogo ${after.code} alterado: ${teamName(after.homeId)} × ${teamName(after.awayId)}`,
    body: `${parts.join('; ')}.${note ? ` ${note}` : ''}`,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  // "Servidor" oficial
  const [serverGames, setServerGames] = useState<Game[]>(seedGames);
  const [serverNotices, setServerNotices] = useState<Notice[]>(seedNotices);
  const [sms, setSms] = useState<SmsRequest[]>([]);
  const [version, setVersion] = useState(1);
  // Cópia local do dispositivo (atleta/professor), salva no armazenamento do aparelho
  const [local, setLocal] = useState<Snapshot>({ games: [], notices: [], lastSync: null });
  const [localVersion, setLocalVersion] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [smsUpdate, setSmsUpdate] = useState<string | null>(null);
  const [smsStatus, setSmsStatus] = useState<SmsStatus>('unavailable');
  const localRef = useRef(local);
  localRef.current = local;

  // Restaura sessão e cópia local ao abrir o app (funciona sem internet).
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const s = JSON.parse(raw);
        if (s.user && s.user.role !== 'admin') {
          setUser(s.user);
          setLocal(s.local);
          setLocalVersion(s.localVersion ?? 0);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Salva a cópia local a cada mudança (inclusive as vindas por SMS).
  useEffect(() => {
    if (!ready) return;
    const data = user && user.role !== 'admin' ? { user, local, localVersion } : null;
    (data ? AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)) : AsyncStorage.removeItem(STORAGE_KEY)).catch(() => {});
  }, [ready, user, local, localVersion]);

  const stamp = () => new Date(NOW.getTime() + version * 60000).toISOString();

  const doSync = useCallback(async () => {
    setSyncError(null);
    setSyncing(true);
    await wait(700);
    if (!online) {
      setSyncing(false);
      setSyncError('Sem conexão. Mostrando os dados da última atualização.');
      return;
    }
    setLocal({ games: serverGames, notices: serverNotices, lastSync: stamp() });
    setLocalVersion(version);
    setSyncing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, serverGames, serverNotices, version]);

  const login = (u: User) => {
    setUser(u);
    setSyncError(null);
    if (u.role !== 'admin') {
      // primeiro acesso exige conexão e baixa os dados
      setLocal({ games: serverGames, notices: serverNotices, lastSync: stamp() });
      setLocalVersion(version);
    }
  };
  const logout = () => {
    setUser(null);
    setLocal({ games: [], notices: [], lastSync: null });
    setLocalVersion(0);
    setSmsUpdate(null);
  };

  const addSms = (notice: Notice, teamIds: string[], text: string) => {
    const reqs: SmsRequest[] = teamIds.map((tid) => {
      const co = coaches[tid];
      const noPhone = !co.phone;
      return {
        id: uid('s'), noticeId: notice.id, teamId: tid, recipient: co.name, phone: co.phone, text,
        state: noPhone ? 'Falhou' : 'Aceito para envio',
        reason: noPhone ? 'Telefone do responsável não cadastrado.' : undefined,
      };
    });
    setSms((s) => [...reqs, ...s]);
  };

  const publishChange: Store['publishChange'] = (gameId, c) => {
    if (!online) return { ok: false, error: 'A edição exige conexão. Reconecte para publicar.' };
    const g = serverGames.find((x) => x.id === gameId);
    if (!g) return { ok: false, error: 'Jogo não encontrado.' };
    const updated: Game = {
      ...g, date: c.date, time: c.time, venue: c.venue, status: 'Alterado', changeNote: c.note || undefined,
      prev: g.prev ?? { date: g.date, time: g.time, venue: g.venue },
    };
    const text = changeNotice(g, updated, c.note);
    const notice: Notice = {
      id: uid('n'), kind: 'Automático', priority: c.priority, target: [g.homeId, g.awayId], gameId: g.id, author: user?.name ?? 'Administração',
      createdAt: new Date(NOW.getTime() + (version + 1) * 60000).toISOString(), ...text,
    };
    setServerGames((gs) => gs.map((x) => (x.id === g.id ? updated : x)));
    setServerNotices((ns) => [notice, ...ns]);
    if (c.priority === 'critical') addSms(notice, [g.homeId, g.awayId], buildChangeSms(g, updated, notice.id, c.priority));
    setVersion((v) => v + 1);
    return { ok: true };
  };

  const publishNotice: Store['publishNotice'] = (n) => {
    if (!online) return { ok: false, error: 'A publicação exige conexão. Reconecte para publicar.' };
    const notice: Notice = {
      id: uid('n'), kind: 'Manual', author: user?.name ?? 'Administração', ...n,
      createdAt: new Date(NOW.getTime() + (version + 1) * 60000).toISOString(),
    };
    setServerNotices((ns) => [notice, ...ns]);
    if (n.priority === 'critical') addSms(notice, n.target === 'all' ? teams.map((t) => t.id) : n.target, `Arena Connect: ${n.title}. ${n.body}`);
    setVersion((v) => v + 1);
    return { ok: true };
  };

  const retrySms = (id: string) => {
    if (!online) return;
    setSms((s) =>
      s.map((r) => {
        if (r.id !== id) return r;
        const co = coaches[r.teamId];
        return co.phone
          ? { ...r, phone: co.phone, state: 'Aceito para envio', reason: undefined }
          : { ...r, reason: 'Telefone do responsável continua sem cadastro.' };
      }),
    );
  };

  const markSmsChip: Store['markSmsChip'] = (id, chip) => setSms((s) => s.map((r) => (r.id === id ? { ...r, chip } : r)));

  /** Aplica na cópia local a alteração de jogo recebida por SMS. Sem internet, sem servidor. */
  const applySms: Store['applySms'] = (raw) => {
    const p = parseChangeSms(raw);
    if (!p) return 'invalid';
    const cur = localRef.current;
    if (cur.notices.some((n) => n.id === p.noticeId)) return 'duplicate';
    const g = cur.games.find((x) => x.id === p.gameId);
    if (!g) return 'unknown-game';
    const updated: Game = {
      ...g, date: p.date, time: p.time, venue: p.venue, status: 'Alterado',
      prev: g.prev ?? { date: g.date, time: g.time, venue: g.venue },
    };
    const notice: Notice = {
      id: p.noticeId, kind: 'Automático', priority: p.priority, target: [g.homeId, g.awayId], gameId: g.id,
      author: 'Organização (recebido por SMS)', createdAt: new Date(NOW.getTime() + (cur.notices.length + 1) * 60000).toISOString(), // relógio fixo da demo
      ...changeNotice(g, updated),
    };
    const next = { ...cur, games: cur.games.map((x) => (x.id === g.id ? updated : x)), notices: [notice, ...cur.notices] };
    localRef.current = next; // vários SMS seguidos precisam enxergar o resultado do anterior
    setLocal(next);
    setSmsUpdate(`${notice.title}. ${notice.body}`);
    return 'applied';
  };

  const isAdmin = user?.role === 'admin';
  const value = useMemo<Store>(
    () => ({
      user, ready, online, setOnline, login, logout,
      games: isAdmin ? serverGames : local.games,
      notices: isAdmin ? serverNotices : local.notices,
      sms, lastSync: local.lastSync, syncing, syncError, sync: doSync,
      hasPending: !isAdmin && localVersion < version,
      publishChange, publishNotice, retrySms, markSmsChip,
      applySms, smsUpdate, dismissSmsUpdate: () => setSmsUpdate(null), smsStatus, setSmsStatus,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, ready, online, serverGames, serverNotices, sms, local, syncing, syncError, doSync, localVersion, version, smsUpdate, smsStatus],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
