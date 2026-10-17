import { Game, Priority, fmtTime, teamName, venueNames } from './data';
import { appUrl } from './env';

// O SMS de alteração de jogo leva os dados de dois jeitos:
//  - link "…/?u=<dados>": tocar abre o app e grava a mudança (Android, iPhone, navegador);
//  - etiqueta "#AC1|<dados>" no fim: lida sozinha pelo APK Android de teste.
// <dados> = idJogo, data, hora, índice do local, idAviso, prioridade (N|C).
// O idAviso é o mesmo do servidor, então sincronizar depois não duplica nada.
export const SMS_TAG = '#AC1|';

export interface ParsedSms {
  gameId: string;
  date: string;
  time: string;
  venue: string;
  noticeId: string;
  priority: Priority;
}

// Sem acentos o SMS cabe em menos partes (alfabeto GSM de 160 caracteres).
const ascii = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const brDate = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

const payload = (g: Game, noticeId: string, priority: Priority, sep: string) =>
  [g.id, g.date, g.time, venueNames.indexOf(g.venue), noticeId, priority === 'critical' ? 'C' : 'N'].join(sep);

export function buildChangeSms(before: Game, after: Game, noticeId: string, priority: Priority): string {
  const when = (g: Pick<Game, 'date' | 'time' | 'venue'>) => `${brDate(g.date)} ${fmtTime(g.time)}, ${g.venue}`;
  return (
    ascii(
      `Arena Connect: jogo ${after.code} ${teamName(after.homeId)} x ${teamName(after.awayId)} alterado. ` +
        `Agora: ${when(after)}. Antes: ${when(before)}. ` +
        `Atualize no app: ${appUrl()}/?u=${payload(after, noticeId, priority, '~')} `,
    ) + `${SMS_TAG}${payload(after, noticeId, priority, '|')}`
  );
}

function decode([gameId, date, time, v, noticeId, p]: string[]): ParsedSms | null {
  const venue = venueNames[Number(v)];
  if (!gameId || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !/^\d{2}:\d{2}$/.test(time ?? '') || !venue || !noticeId) return null;
  return { gameId, date, time, venue, noticeId, priority: p?.trim() === 'C' ? 'critical' : 'normal' };
}

/** Lê os dados de um SMS colado/recebido, pela etiqueta ou pelo link. */
export function parseChangeSms(raw: string): ParsedSms | null {
  const i = raw.indexOf(SMS_TAG);
  if (i >= 0) return decode(raw.slice(i + SMS_TAG.length).trim().split(/\s/)[0].split('|'));
  const m = raw.match(/[?&]u=([^\s&]+)/);
  return m ? decode(decodeURIComponent(m[1]).split('~')) : null;
}
