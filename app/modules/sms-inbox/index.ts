import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

// Só existe no APK Android (build próprio). No Expo Go, no iOS e na web fica indisponível.
const native = Platform.OS === 'android' ? requireOptionalNativeModule<any>('SmsInbox') : null;

export const smsInboxAvailable = !!native;

/** Retorna e limpa os SMS do Arena Connect recebidos desde a última chamada. */
export const drainSms = (): string[] => (native ? (native.drain() as string[]) : []);

/** Avisa quando chega um SMS novo com o app aberto. Retorna a função para cancelar. */
export const onSmsArrived = (cb: () => void): (() => void) => {
  if (!native) return () => {};
  const sub = native.addListener('onSms', cb);
  return () => sub.remove();
};
