package expo.modules.smsinbox

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.provider.Telephony
import org.json.JSONArray

/**
 * Recebe SMS mesmo com o app fechado. Aceita só os que vêm de um número oficial e carregam a
 * etiqueta "#AC1|": guarda na fila local e mostra uma notificação de alerta, sem internet.
 */
class SmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
    val parts = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
    // SMS longo chega em várias partes: junta as partes do mesmo remetente.
    val bySender = linkedMapOf<String, StringBuilder>()
    for (p in parts) bySender.getOrPut(p.originatingAddress ?: "") { StringBuilder() }.append(p.messageBody ?: "")
    val trusted = getTrustedSenders(context)
    for ((sender, body) in bySender) {
      val text = body.toString()
      if (!text.contains(TAG) || trusted.none { sameNumber(it, sender) }) continue
      enqueue(context, text)
      notifyAlert(context, text)
      listener?.invoke()
    }
  }

  companion object {
    const val TAG = "#AC1|"
    private const val PREFS = "arena_connect_sms"
    private const val KEY_QUEUE = "queue"
    private const val KEY_SENDERS = "senders"
    private const val CHANNEL_ID = "arena_alerts"

    /** Preenchido pelo módulo enquanto o JS está vivo, para avisar em tempo real. */
    @Volatile var listener: (() -> Unit)? = null

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    @Synchronized fun enqueue(context: Context, body: String) {
      val arr = JSONArray(prefs(context).getString(KEY_QUEUE, "[]"))
      arr.put(body)
      prefs(context).edit().putString(KEY_QUEUE, arr.toString()).apply()
    }

    @Synchronized fun drain(context: Context): List<String> {
      val arr = JSONArray(prefs(context).getString(KEY_QUEUE, "[]"))
      prefs(context).edit().putString(KEY_QUEUE, "[]").apply()
      return List(arr.length()) { arr.getString(it) }
    }

    fun setTrustedSenders(context: Context, senders: List<String>) {
      prefs(context).edit().putString(KEY_SENDERS, JSONArray(senders).toString()).apply()
    }

    fun getTrustedSenders(context: Context): List<String> {
      val arr = JSONArray(prefs(context).getString(KEY_SENDERS, "[]"))
      return List(arr.length()) { arr.getString(it) }
    }

    /**
     * Compara números ignorando formatação. Celulares chegam como "+5549999990000" ou "49999990000":
     * compara os 11 últimos dígitos (DDD + número). Números curtos (ex.: 40199) precisam ser iguais.
     */
    fun sameNumber(a: String, b: String): Boolean {
      val da = a.filter { it.isDigit() }
      val db = b.filter { it.isDigit() }
      if (da.isEmpty() || db.isEmpty()) return false
      if (da.length < 11 || db.length < 11) return da == db
      return da.takeLast(11) == db.takeLast(11)
    }

    private fun notifyAlert(context: Context, sms: String) {
      try {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val alarm = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
          ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm.getNotificationChannel(CHANNEL_ID) == null) {
          val ch = NotificationChannel(CHANNEL_ID, "Alertas do evento", NotificationManager.IMPORTANCE_HIGH).apply {
            description = "Mudanças de horário e local recebidas por SMS"
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 600, 300, 600, 300, 600)
            enableLights(true)
            lightColor = Color.RED
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            setSound(alarm, AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_ALARM)
              .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
              .build())
          }
          nm.createNotificationChannel(ch)
        }

        val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        val pending = launch?.let {
          PendingIntent.getActivity(context, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        }

        // Texto legível = tudo antes da etiqueta.
        val readable = sms.substringBefore(TAG).trim().removePrefix("Arena Connect:").trim()
        val critical = sms.trim().endsWith("|C")
        val title = if (critical) "⚠ ALERTA OLESC 2026 · Jogo alterado" else "OLESC 2026 · Jogo alterado"

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          Notification.Builder(context, CHANNEL_ID)
        } else {
          @Suppress("DEPRECATION")
          Notification.Builder(context).setPriority(Notification.PRIORITY_MAX).setSound(alarm)
        }
        val n = builder
          .setSmallIcon(context.applicationInfo.icon)
          .setContentTitle(title)
          .setContentText(readable)
          .setStyle(Notification.BigTextStyle().bigText(readable))
          .setCategory(Notification.CATEGORY_ALARM)
          .setVisibility(Notification.VISIBILITY_PUBLIC)
          .setColor(Color.parseColor("#B42318"))
          .setAutoCancel(true)
          .apply { if (pending != null) setContentIntent(pending) }
          .build()
        nm.notify(sms.hashCode(), n)
      } catch (_: Exception) {
        // Sem permissão de notificação: os dados ficam na fila e entram ao abrir o app.
      }
    }
  }
}
