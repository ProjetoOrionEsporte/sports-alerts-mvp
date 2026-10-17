// Número oficial que envia os SMS do evento. O APK Android só aceita SMS dele.
// Vem do build (EXPO_PUBLIC_SMS_SENDER) para não ir parar no app web, que é público.
// Pode ser trocado no próprio app, em Informações. Produção: número/short code do provedor de SMS.
export const DEFAULT_SMS_SENDER = process.env.EXPO_PUBLIC_SMS_SENDER ?? '';
