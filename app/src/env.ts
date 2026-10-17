import { Platform } from 'react-native';

// Parâmetros da URL (só na web). Usados pelo modo apresentação e pelo link do SMS.
const params =
  Platform.OS === 'web' && typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

export const param = (name: string) => params?.get(name) ?? null;

/** Identifica o "aparelho" quando há dois apps na mesma página (modo apresentação). */
export const deviceId = param('device') ?? 'main';

/** localStorage compartilhado entre os dois aparelhos da apresentação (servidor e operadora simulados). */
export const sharedStorage: Storage | null =
  Platform.OS === 'web' && typeof localStorage !== 'undefined' ? localStorage : null;

export const appUrl = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : 'https://arena-connect-prototipo.vercel.app';

/** Remove parâmetros já tratados da barra de endereço, para não reaplicar ao recarregar. */
export function dropParam(name: string) {
  if (!params || typeof window === 'undefined') return;
  params.delete(name);
  const q = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${q ? `?${q}` : ''}`);
}
