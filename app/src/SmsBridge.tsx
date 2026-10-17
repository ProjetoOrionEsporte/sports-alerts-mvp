import { useEffect } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import { drainSms, onSmsArrived, setTrustedSenders, smsInboxAvailable } from '../modules/sms-inbox';
import { useStore } from './store';

/**
 * Liga o recebimento de SMS (Android) à cópia local: lê a fila do receptor nativo ao abrir o app,
 * ao voltar para ele e quando chega um SMS novo. Não renderiza nada.
 */
export default function SmsBridge() {
  const { applySms, setSmsStatus, smsSender } = useStore();

  // O receptor nativo lê essa lista mesmo com o app fechado.
  useEffect(() => {
    setTrustedSenders(smsSender.trim() ? [smsSender.trim()] : []);
  }, [smsSender]);

  useEffect(() => {
    if (!smsInboxAvailable) return setSmsStatus('unavailable');
    let off: (() => void) | undefined;
    let sub: { remove: () => void } | undefined;
    let alive = true;

    const flush = () => drainSms().forEach((body) => applySms(body));

    (async () => {
      const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
      // Android 13+: sem essa permissão o alerta não aparece (os dados ainda entram ao abrir o app).
      if (Number(Platform.Version) >= 33) await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (!alive) return;
      if (r !== PermissionsAndroid.RESULTS.GRANTED) return setSmsStatus('denied');
      setSmsStatus('on');
      flush();
      off = onSmsArrived(flush);
      sub = AppState.addEventListener('change', (s) => s === 'active' && flush());
    })();

    return () => {
      alive = false;
      off?.();
      sub?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
