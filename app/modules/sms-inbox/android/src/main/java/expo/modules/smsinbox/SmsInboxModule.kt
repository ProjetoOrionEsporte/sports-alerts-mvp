package expo.modules.smsinbox

import android.content.Context
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SmsInboxModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("SmsInbox")

    Events("onSms")

    OnCreate {
      SmsReceiver.listener = { sendEvent("onSms", mapOf<String, Any>()) }
    }

    OnDestroy {
      SmsReceiver.listener = null
    }

    // Entrega e limpa a fila de SMS aceitos (inclusive os que chegaram com o app fechado).
    Function("drain") {
      SmsReceiver.drain(context)
    }

    // Números oficiais aceitos pelo receptor. Fica salvo no aparelho e vale com o app fechado.
    Function("setTrustedSenders") { senders: List<String> ->
      SmsReceiver.setTrustedSenders(context, senders)
    }

    Function("getTrustedSenders") {
      SmsReceiver.getTrustedSenders(context)
    }
  }
}
