import { Linking, Platform } from 'react-native';
import * as SMS from 'expo-sms';

/**
 * Abre o app de mensagens do celular com o SMS pronto. Sai pelo chip, sem internet nem servidor.
 * Sem destinatário fixo: na prova ao vivo o admin escolhe o contato (o app web é público, sem números reais).
 */
export async function openSmsComposer(text: string): Promise<'sent' | 'opened' | 'unavailable'> {
  if (Platform.OS !== 'web' && (await SMS.isAvailableAsync())) {
    const { result } = await SMS.sendSMSAsync([], text);
    return result === 'sent' ? 'sent' : 'opened';
  }
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (!/Android|iPhone|iPad/i.test(ua)) return 'unavailable';
  // iOS usa "&body=", Android aceita "?body=": "sms:?&body=" funciona nos dois.
  await Linking.openURL(`sms:?&body=${encodeURIComponent(text)}`);
  return 'opened';
}
