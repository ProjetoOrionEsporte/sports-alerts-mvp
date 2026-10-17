package expo.modules.smsinbox

import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SmsInboxModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SmsInbox")

    Events("onSms")

    OnCreate {
      SmsReceiver.listener = { sendEvent("onSms", mapOf<String, Any>()) }
    }

    OnDestroy {
      SmsReceiver.listener = null
    }

    // Entrega e limpa a fila de SMS recebidos (inclusive os que chegaram com o app fechado).
    Function("drain") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      SmsReceiver.drain(context)
    }
  }
}
