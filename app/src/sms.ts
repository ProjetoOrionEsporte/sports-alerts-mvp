import { Game, Priority, fmtTime, teamName } from './data';

// Formato do SMS de alteração de jogo: texto legível + etiqueta que o app lê sozinho.
//   ... #AC1|<idJogo>|<AAAA-MM-DD>|<HH:mm>|<local>|<idAviso>|<N|C>
// O idAviso é o mesmo do aviso no servidor, então a próxima sincronização não duplica nada.
export const SMS_TAG = '#AC1|';

export interface ParsedSms {
  gameId: string;
  date: string;
  time: string;
  venue: string;
  noticeId: string;
  priority: Priority;
}

const brDate = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

export function buildChangeSms(before: Game, after: Game, noticeId: string, priority: Priority): string {
  const when = (g: Pick<Game, 'date' | 'time' | 'venue'>) => `${brDate(g.date)} ${fmtTime(g.time)}, ${g.venue}`;
  return (
    `Arena Connect: jogo ${after.code} ${teamName(after.homeId)} x ${teamName(after.awayId)} alterado. ` +
    `Agora: ${when(after)}. Antes: ${when(before)}. ` +
    `${SMS_TAG}${after.id}|${after.date}|${after.time}|${after.venue}|${noticeId}|${priority === 'critical' ? 'C' : 'N'}`
  );
}

export function parseChangeSms(raw: string): ParsedSms | null {
  const i = raw.indexOf(SMS_TAG);
  if (i < 0) return null;
  const [gameId, date, time, venue, noticeId, p] = raw.slice(i + SMS_TAG.length).trim().split('|');
  if (!gameId || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !/^\d{2}:\d{2}$/.test(time ?? '') || !venue || !noticeId) return null;
  return { gameId, date, time, venue, noticeId, priority: p?.trim() === 'C' ? 'critical' : 'normal' };
}
