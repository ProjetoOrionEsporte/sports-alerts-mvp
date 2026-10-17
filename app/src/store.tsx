import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Game, Notice, Priority, SmsRequest, User, coaches, seedGames, seedNotices, teamName, teams, users, NOW,
} from './data';
import { buildChangeSms, parseChangeSms } from './sms';
import { DEFAULT_SMS_SENDER } from './config';
import { deviceId, dropParam, param, sharedStorage } from './env';

interface Snapshot { games: Game[]; notices: Notice[]; lastSync: string | null }

interface GameChange { date: string; time: string; venue: string; note: string; priority: Priority }

export type SmsStatus = 'unavailable' | 'on' | 'denied';

export interface SmsAlert { title: string; body: string; via: 'sms' | 'link' }

/** Estado do "servidor" do protótipo. Na web fica no localStorage, compartilhado entre os aparelhos da apresentação. */
interface ServerState { games: Game[]; notices: Notice[]; sms: SmsRequest[]; version: number }

/** SMS em trânsito pela "operadora" simulada (modo apresentação). Chega mesmo sem internet. */
interface CarrierMsg { id: string; teamId: string; text: string }

type ApplyResult = 'applied' | 'duplicate' | 'invalid' | 'unknown-game';

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
  publishChange: (gameId: string, c: GameChange) => { ok: boolean; error?: string; smsText?: string };
  publishNotice: (n: { title: string; body: string; priority: Priority; target: 'all' | string[] }) => { ok: boolean; error?: string };
  retrySms: (id: string) => void;
  markSmsChip: (id: string, s: NonNullable<SmsRequest['chip']>) => void;
  // atualização offline por SMS (atleta/professor)
  applySms: (raw: string, via?: SmsAlert['via']) => ApplyResult;
  smsUpdate: string | null;
  dismissSmsUpdate: () => void;
  smsAlert: SmsAlert | null;
  dismissSmsAlert: () => void;
  smsStatus: SmsStatus;
  setSmsStatus: (s: SmsStatus) => void;
  smsSender: string; // número oficial aceito pelo receptor de SMS (APK)
  setSmsSender: (n: string) => void;
}

const Ctx = createContext<Store>(null as unknown as Store);
export const useStore = () => useContext(Ctx);

const DEVICE_KEY = `arena-connect:v2:${deviceId}`; // sessão + cópia local deste aparelho
const SENDER_KEY = 'arena-connect:sms-sender'; // configuração do aparelho, não sai no logout
const SERVER_KEY = 'arena-connect:server';
const CARRIER_KEY = 'arena-connect:carrier';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const brDate = (iso: string) => iso.split('-').reverse().join('/');
const readShared = <T,>(key: string, fallback: T): T => {
  try {
    const raw = sharedStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeShared = (key: string, v: unknown) => {
  try {
    sharedStorage?.setItem(key, JSON.stringify(v));
  } catch {}
};
const seedServer = (): ServerState => ({ games: seedGames, notices: seedNotices, sms: [], version: 1 });

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

/** Sincronização: o servidor é a fonte oficial, mas não desfaz uma mudança mais nova que já chegou por SMS. */
function mergeFromServer(server: ServerState, local: Snapshot) {
  const games = server.games.map((sg) => {
    const lg = local.games.find((x) => x.id === sg.id);
    const same = lg && lg.date === sg.date && lg.time === sg.time && lg.venue === sg.venue;
    return lg && !same && (lg.updatedAt ?? '') > (sg.updatedAt ?? '') ? lg : sg;
  });
  const ids = new Set(server.notices.map((n) => n.id));
  return { games, notices: [...server.notices, ...local.notices.filter((n) => !ids.has(n.id))] };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [server, setServer] = useState<ServerState>(() => readShared(SERVER_KEY, seedServer()));
  // Cópia local do aparelho (atleta/professor), salva no armazenamento do aparelho
  const [local, setLocal] = useState<Snapshot>({ games: [], notices: [], lastSync: null });
  const [localVersion, setLocalVersion] = useState(0);
  const [processed, setProcessed] = useState<string[]>([]); // SMS da operadora já tratados
  const [carrierTick, setCarrierTick] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [smsUpdate, setSmsUpdate] = useState<string | null>(null);
  const [smsAlert, setSmsAlert] = useState<SmsAlert | null>(null);
  const [smsStatus, setSmsStatus] = useState<SmsStatus>('unavailable');
  const [smsSender, setSmsSenderState] = useState(DEFAULT_SMS_SENDER);
  const localRef = useRef(local);
  localRef.current = local;
  const serverRef = useRef(server);
  serverRef.current = server;

  const commitServer = (fn: (s: ServerState) => ServerState) => {
    const next = fn(serverRef.current);
    serverRef.current = next;
    setServer(next);
    writeShared(SERVER_KEY, next);
  };

  const setSmsSender = (n: string) => {
    setSmsSenderState(n);
    AsyncStorage.setItem(SENDER_KEY, n).catch(() => {});
  };

  // Restaura sessão e cópia local ao abrir o app (funciona sem internet).
  useEffect(() => {
    AsyncStorage.getItem(SENDER_KEY).then((n) => n !== null && setSmsSenderState(n)).catch(() => {});
    AsyncStorage.getItem(DEVICE_KEY)
      .then((raw) => {
        if (!raw) return;
        const s = JSON.parse(raw);
        if (s.user) setUser(s.user);
        if (s.local) setLocal(s.local);
        setLocalVersion(s.localVersion ?? 0);
        setProcessed(s.processed ?? []);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Salva sessão e cópia local a cada mudança (inclusive as vindas por SMS).
  useEffect(() => {
    if (!ready) return;
    const data = user ? { user, local, localVersion, processed } : null;
    (data ? AsyncStorage.setItem(DEVICE_KEY, JSON.stringify(data)) : AsyncStorage.removeItem(DEVICE_KEY)).catch(() => {});
  }, [ready, user, local, localVersion, processed]);

  const stamp = (v = serverRef.current.version) => new Date(NOW.getTime() + v * 60000).toISOString();

  const doSync = useCallback(async () => {
    setSyncError(null);
    setSyncing(true);
    await wait(700);
    if (!online) {
      setSyncing(false);
      setSyncError('Sem conexão. Mostrando os dados da última atualização.');
      return;
    }
    const s = serverRef.current;
    setLocal({ ...mergeFromServer(s, localRef.current), lastSync: stamp(s.version) });
    setLocalVersion(s.version);
    setSyncing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const login = (u: User) => {
    setUser(u);
    setSyncError(null);
    if (u.role !== 'admin') {
      // primeiro acesso exige conexão e baixa os dados
      const s = serverRef.current;
      const next = { games: s.games, notices: s.notices, lastSync: stamp(s.version) };
      localRef.current = next;
      setLocal(next);
      setLocalVersion(s.version);
    }
  };
  const logout = () => {
    setUser(null);
    setLocal({ games: [], notices: [], lastSync: null });
    setLocalVersion(0);
    setSmsUpdate(null);
    setSmsAlert(null);
  };

  const smsRequests = (notice: Notice, teamIds: string[], text: string): SmsRequest[] =>
    teamIds.map((tid) => {
      const co = coaches[tid];
      const noPhone = !co.phone;
      return {
        id: uid('s'), noticeId: notice.id, teamId: tid, recipient: co.name, phone: co.phone, text,
        state: noPhone ? 'Falhou' : 'Aceito para envio',
        reason: noPhone ? 'Telefone do responsável não cadastrado.' : undefined,
      };
    });

  /** Entrega os SMS aceitos à "operadora" simulada: chegam aos aparelhos das equipes mesmo offline. */
  const deliver = (reqs: SmsRequest[]) => {
    const ok = reqs.filter((r) => r.state === 'Aceito para envio');
    if (!ok.length) return;
    const queue = readShared<CarrierMsg[]>(CARRIER_KEY, []);
    writeShared(CARRIER_KEY, [...queue, ...ok.map((r) => ({ id: r.id, teamId: r.teamId, text: r.text }))]);
  };

  const publishChange: Store['publishChange'] = (gameId, c) => {
    if (!online) return { ok: false, error: 'A edição exige conexão. Reconecte para publicar.' };
    const s = serverRef.current;
    const g = s.games.find((x) => x.id === gameId);
    if (!g) return { ok: false, error: 'Jogo não encontrado.' };
    const updated: Game = {
      ...g, date: c.date, time: c.time, venue: c.venue, status: 'Alterado', changeNote: c.note || undefined,
      prev: g.prev ?? { date: g.date, time: g.time, venue: g.venue }, updatedAt: new Date().toISOString(),
    };
    const notice: Notice = {
      id: uid('n'), kind: 'Automático', priority: c.priority, target: [g.homeId, g.awayId], gameId: g.id, author: user?.name ?? 'Administração',
      createdAt: stamp(s.version + 1), ...changeNotice(g, updated, c.note),
    };
    const smsText = buildChangeSms(g, updated, notice.id, c.priority);
    const reqs = c.priority === 'critical' ? smsRequests(notice, [g.homeId, g.awayId], smsText) : [];
    commitServer((st) => ({
      games: st.games.map((x) => (x.id === g.id ? updated : x)),
      notices: [notice, ...st.notices],
      sms: [...reqs, ...st.sms],
      version: st.version + 1,
    }));
    deliver(reqs);
    return { ok: true, smsText };
  };

  const publishNotice: Store['publishNotice'] = (n) => {
    if (!online) return { ok: false, error: 'A publicação exige conexão. Reconecte para publicar.' };
    const s = serverRef.current;
    const notice: Notice = { id: uid('n'), kind: 'Manual', author: user?.name ?? 'Administração', ...n, createdAt: stamp(s.version + 1) };
    const reqs = n.priority === 'critical'
      ? smsRequests(notice, n.target === 'all' ? teams.map((t) => t.id) : n.target, `Arena Connect: ${n.title}. ${n.body}`)
      : [];
    commitServer((st) => ({ ...st, notices: [notice, ...st.notices], sms: [...reqs, ...st.sms], version: st.version + 1 }));
    return { ok: true };
  };

  const retrySms = (id: string) => {
    if (!online) return;
    commitServer((st) => ({
      ...st,
      sms: st.sms.map((r) => {
        if (r.id !== id) return r;
        const co = coaches[r.teamId];
        return co.phone
          ? { ...r, phone: co.phone, state: 'Aceito para envio', reason: undefined }
          : { ...r, reason: 'Telefone do responsável continua sem cadastro.' };
      }),
    }));
  };

  const markSmsChip: Store['markSmsChip'] = (id, chip) =>
    commitServer((st) => ({ ...st, sms: st.sms.map((r) => (r.id === id ? { ...r, chip } : r)) }));

  /** Aplica na cópia local a alteração de jogo recebida por SMS. Sem internet, sem servidor. */
  const applySms: Store['applySms'] = (raw, via = 'sms') => {
    const p = parseChangeSms(raw);
    if (!p) return 'invalid';
    const cur = localRef.current;
    if (cur.notices.some((n) => n.id === p.noticeId)) return 'duplicate';
    const g = cur.games.find((x) => x.id === p.gameId);
    if (!g) return 'unknown-game';
    const updated: Game = {
      ...g, date: p.date, time: p.time, venue: p.venue, status: 'Alterado',
      prev: g.prev ?? { date: g.date, time: g.time, venue: g.venue }, updatedAt: new Date().toISOString(),
    };
    const text = changeNotice(g, updated);
    const notice: Notice = {
      id: p.noticeId, kind: 'Automático', priority: p.priority, target: [g.homeId, g.awayId], gameId: g.id,
      author: 'Organização (recebido por SMS)', createdAt: new Date(NOW.getTime() + (cur.notices.length + 1) * 60000).toISOString(), // relógio fixo da demo
      ...text,
    };
    const next = { ...cur, games: cur.games.map((x) => (x.id === g.id ? updated : x)), notices: [notice, ...cur.notices] };
    localRef.current = next; // vários SMS seguidos precisam enxergar o resultado do anterior
    setLocal(next);
    setSmsUpdate(`${text.title}. ${text.body}`);
    setSmsAlert({ ...text, via });
    return 'applied';
  };

  // Web: acompanha a conexão real do aparelho (o botão de demonstração continua podendo simular).
  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('onLine' in navigator)) return;
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Outros aparelhos da apresentação: acompanha o servidor e recebe SMS da operadora simulada.
  useEffect(() => {
    if (typeof window === 'undefined' || !sharedStorage) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === SERVER_KEY) setServer(readShared(SERVER_KEY, seedServer()));
      if (e.key === CARRIER_KEY) setCarrierTick((t) => t + 1);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => {
    if (!ready || !user || user.role === 'admin' || !user.teamId) return;
    const mine = readShared<CarrierMsg[]>(CARRIER_KEY, []).filter((m) => m.teamId === user.teamId && !processed.includes(m.id));
    if (!mine.length) return;
    mine.forEach((m) => applySms(m.text, 'sms'));
    setProcessed((p) => [...p, ...mine.map((m) => m.id)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrierTick, ready, user]);

  // Link do SMS (…/?u=…): grava a mudança assim que houver um atleta/professor logado neste aparelho.
  const linkDone = useRef(false);
  useEffect(() => {
    const u = param('u');
    if (!u || linkDone.current || !ready || !user || user.role === 'admin') return;
    linkDone.current = true;
    const r = applySms(`?u=${u}`, 'link');
    if (r === 'duplicate') setSmsUpdate('Esse SMS já estava aplicado neste aparelho.');
    dropParam('u');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  // Modo apresentação: entra direto no perfil pedido (?as=admin|coach|athlete).
  useEffect(() => {
    const as = param('as');
    if (!ready || user || !as) return;
    const u = users.find((x) => x.role === as);
    if (u) login(u);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const isAdmin = user?.role === 'admin';
  const value = useMemo<Store>(
    () => ({
      user, ready, online, setOnline, login, logout,
      games: isAdmin ? server.games : local.games,
      notices: isAdmin ? server.notices : local.notices,
      sms: server.sms, lastSync: local.lastSync, syncing, syncError, sync: doSync,
      hasPending: !isAdmin && localVersion < server.version,
      publishChange, publishNotice, retrySms, markSmsChip,
      applySms, smsUpdate, dismissSmsUpdate: () => setSmsUpdate(null),
      smsAlert, dismissSmsAlert: () => setSmsAlert(null),
      smsStatus, setSmsStatus, smsSender, setSmsSender,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, ready, online, server, local, syncing, syncError, doSync, localVersion, smsUpdate, smsAlert, smsStatus, smsSender],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
