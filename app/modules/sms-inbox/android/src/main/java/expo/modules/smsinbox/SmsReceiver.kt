package expo.modules.smsinbox

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import org.json.JSONArray

/** Guarda na fila (SharedPreferences) só os SMS que carregam a etiqueta "#AC1|" do Arena Connect. */
class SmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
    val parts = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
    // SMS longo chega em várias partes: junta as partes do mesmo remetente.
    val bySender = linkedMapOf<String, StringBuilder>()
    for (p in parts) bySender.getOrPut(p.originatingAddress ?: "") { StringBuilder() }.append(p.messageBody ?: "")
    for ((_, body) in bySender) {
      val text = body.toString()
      if (text.contains(TAG)) {
        enqueue(context, text)
        listener?.invoke()
      }
    }
  }

  companion object {
    const val TAG = "#AC1|"
    private const val PREFS = "arena_connect_sms"
    private const val KEY = "queue"

    /** Preenchido pelo módulo enquanto o JS está vivo, para avisar em tempo real. */
    @Volatile var listener: (() -> Unit)? = null

    @Synchronized fun enqueue(context: Context, body: String) {
      val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      val arr = JSONArray(prefs.getString(KEY, "[]"))
      arr.put(body)
      prefs.edit().putString(KEY, arr.toString()).apply()
    }

    @Synchronized fun drain(context: Context): List<String> {
      val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      val arr = JSONArray(prefs.getString(KEY, "[]"))
      prefs.edit().putString(KEY, "[]").apply()
      return List(arr.length()) { arr.getString(it) }
    }
  }
}
