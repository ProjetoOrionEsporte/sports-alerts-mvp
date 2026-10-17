export type Role = 'athlete' | 'coach' | 'admin';
export type Priority = 'normal' | 'critical';

export interface Team { id: string; name: string }
export interface User {
  id: string;
  name: string;
  role: Role;
  teamId?: string;
  title: string;
  initials: string;
}
export interface Game {
  id: string;
  code: string; // #040
  sport: string;
  homeId: string;
  awayId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  venue: string;
  phase: string;
  status: 'Agendado' | 'Alterado';
  prev?: { date: string; time: string; venue: string };
  changeNote?: string;
}
export interface Notice {
  id: string;
  title: string;
  body: string;
  priority: Priority;
  target: 'all' | string[]; // 'all' ou ids de equipes
  kind: 'Manual' | 'Automático';
  gameId?: string;
  createdAt: string; // ISO
  author: string;
}
export type SmsState = 'Aceito para envio' | 'Falhou';
export interface SmsRequest {
  id: string;
  noticeId: string;
  teamId: string;
  recipient: string;
  phone: string;
  state: SmsState;
  reason?: string;
  text: string; // conteúdo do SMS (com a etiqueta lida pelo app)
  chip?: 'Composição aberta' | 'Enviado pelo aparelho'; // envio feito pelo chip do admin
}

// "Agora" fixo para a demonstração (domingo da OLESC 2026, meio-dia).
export const NOW = new Date('2026-10-18T12:00:00');

export const EVENT = { name: 'OLESC 2026', status: 'Em andamento' };

export const teams: Team[] = [
  { id: 'chp', name: 'Chapecó' },
  { id: 'ita', name: 'Itajaí' },
  { id: 'flo', name: 'Florianópolis' },
  { id: 'cri', name: 'Criciúma' },
  { id: 'joi', name: 'Joinville' },
  { id: 'blu', name: 'Blumenau' },
  { id: 'sjo', name: 'São José' },
  { id: 'lag', name: 'Lages' },
  { id: 'jar', name: 'Jaraguá do Sul' },
  { id: 'bru', name: 'Brusque' },
  { id: 'tub', name: 'Tubarão' },
  { id: 'con', name: 'Concórdia' },
];

export const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? id;

export const users: User[] = [
  { id: 'u-ath', name: 'Lucas Ferreira', role: 'athlete', teamId: 'chp', title: 'Atleta · Voleibol masculino · Chapecó', initials: 'LF' },
  { id: 'u-coa', name: 'Rafael Souza', role: 'coach', teamId: 'chp', title: 'Professor · Chapecó', initials: 'RS' },
  { id: 'u-adm', name: 'Mariana Costa', role: 'admin', title: 'Administradora', initials: 'MC' },
];

// Responsável (professor) de cada equipe, destino dos SMS. Itajaí sem telefone para demonstrar falha.
export const coaches: Record<string, { name: string; phone: string }> = Object.fromEntries(
  teams.map((t, i) => [
    t.id,
    {
      name: t.id === 'chp' ? 'Rafael Souza' : `Prof. ${t.name}`,
      phone: t.id === 'ita' ? '' : `+55 49 99900-${String(1000 + i * 7)}`,
    },
  ]),
);

export const roster = [
  'Lucas Ferreira', 'Mateus Almeida', 'Pedro Henrique', 'João Vitor', 'Gabriel Santos', 'Enzo Martins', 'Thiago Lima', 'Rodrigo Pires',
];

export const instructions = [
  { title: 'Credenciamento', text: 'Apresente documento com foto e a ficha da equipe na secretaria do evento, uma hora antes do primeiro jogo.' },
  { title: 'Chegada ao local', text: 'Equipes devem chegar ao ginásio 40 minutos antes do horário marcado para aquecimento e súmula.' },
  { title: 'Uniforme', text: 'Uniforme completo e numerado. Camisas sem número não serão aceitas na súmula.' },
  { title: 'Atendimento médico', text: 'Posto médico no Ginásio do Sesi, entrada lateral. Emergências: ligue 192.' },
];

export const venues: Record<string, string> = {
  'Ginásio do Sesi': 'Rua das Palmeiras, 450. Entrada principal pela Rua A; estacionamento nos fundos.',
  'Arena Multiuso': 'Av. Beira-Mar, 1200. Portão 3 para equipes.',
  'Ginásio Municipal': 'Rua do Esporte, 80. Acesso pela lateral esquerda.',
  'Centro Esportivo Sul': 'Rod. SC-401, km 3. Entrada de equipes no portão sul.',
};
export const venueNames = Object.keys(venues);

export const transport = (teamId: string) => ({
  pickup: teamId === 'chp' ? 'Hotel Central, Rua XV de Novembro, 300' : 'Hotel da equipe',
  time: '12h00',
  destination: 'Ginásio do Sesi',
  note: 'Ônibus 2 da organização. Retorno 30 minutos após o fim do jogo.',
});

export const seedGames: Game[] = [
  { id: 'g40', code: '#040', sport: 'Voleibol masculino', homeId: 'chp', awayId: 'ita', date: '2026-10-18', time: '13:00', venue: 'Ginásio do Sesi', phase: 'Quartas de final', status: 'Agendado' },
  { id: 'g41', code: '#041', sport: 'Basquete feminino', homeId: 'flo', awayId: 'cri', date: '2026-10-18', time: '13:30', venue: 'Arena Multiuso', phase: 'Semifinal', status: 'Agendado' },
  { id: 'g42', code: '#042', sport: 'Futsal feminino', homeId: 'joi', awayId: 'blu', date: '2026-10-18', time: '14:00', venue: 'Ginásio Municipal', phase: 'Semifinal', status: 'Agendado' },
  { id: 'g43', code: '#043', sport: 'Handebol masculino', homeId: 'sjo', awayId: 'lag', date: '2026-10-18', time: '15:00', venue: 'Centro Esportivo Sul', phase: 'Semifinal', status: 'Agendado' },
  { id: 'g44', code: '#044', sport: 'Voleibol feminino', homeId: 'jar', awayId: 'bru', date: '2026-10-18', time: '16:00', venue: 'Ginásio do Sesi', phase: 'Semifinal', status: 'Agendado' },
  { id: 'g45', code: '#045', sport: 'Futsal masculino', homeId: 'tub', awayId: 'con', date: '2026-10-18', time: '17:00', venue: 'Ginásio Municipal', phase: 'Quartas de final', status: 'Agendado' },
  { id: 'g46', code: '#046', sport: 'Voleibol masculino', homeId: 'chp', awayId: 'bru', date: '2026-10-19', time: '10:00', venue: 'Ginásio do Sesi', phase: 'Semifinal', status: 'Agendado' },
];

export const seedNotices: Notice[] = [
  {
    id: 'n1', title: 'Boas-vindas à OLESC 2026', kind: 'Manual', priority: 'normal', target: 'all', author: 'Mariana Costa',
    body: 'Consulte a programação e as orientações de transporte neste aplicativo. Toque em Atualizar para receber as últimas mudanças.',
    createdAt: '2026-10-17T18:00:00',
  },
  {
    id: 'n2', title: 'Chegada ao Ginásio do Sesi', kind: 'Manual', priority: 'normal', target: ['chp', 'ita'], author: 'Mariana Costa',
    body: 'Equipes com jogo no Ginásio do Sesi devem entrar pelo portão lateral. A entrada principal está reservada ao público.',
    createdAt: '2026-10-18T08:30:00',
  },
];

// ---- formatação (sem depender de Intl no Hermes) ----
const DOW = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MONTH = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export const gameDate = (g: { date: string; time: string }) => new Date(`${g.date}T${g.time}:00`);
export const fmtTime = (t: string) => t.replace(':', 'h');
export const fmtDateLong = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return `${DOW[d.getDay()][0].toUpperCase()}${DOW[d.getDay()].slice(1)}, ${d.getDate()} de ${MONTH[d.getMonth()]}`;
};
export const fmtDateShort = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
export const fmtStamp = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} às ${p(d.getHours())}h${p(d.getMinutes())}`;
};
