import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStore } from './store';
import { font } from './theme';

/** Três bipes curtos (web). No celular nativo usa vibração. */
function siren() {
  if (Platform.OS !== 'web') return Vibration.vibrate([0, 500, 200, 500, 200, 500]);
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(880, ctx.currentTime + t);
      o.frequency.linearRampToValueAtTime(1320, ctx.currentTime + t + 0.25);
      g.gain.setValueAtTime(0.08, ctx.currentTime + t);
      g.gain.setValueAtTime(0, ctx.currentTime + t + 0.28);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.3);
    });
    (navigator as any).vibrate?.([500, 200, 500, 200, 500]);
  } catch {}
}

/** Alerta estilo Defesa Civil quando uma mudança chega por SMS. */
export default function SmsAlertOverlay() {
  const { smsAlert, dismissSmsAlert } = useStore();
  useEffect(() => {
    if (smsAlert) siren();
  }, [smsAlert]);
  if (!smsAlert) return null;
  return (
    <View style={s.backdrop} accessibilityViewIsModal accessibilityLiveRegion="assertive">
      <View style={s.card}>
        <View style={s.head}>
          <Feather name="alert-octagon" size={22} color="#fff" />
          <Text style={s.kicker}>ALERTA · OLESC 2026</Text>
        </View>
        <Text style={s.title}>{smsAlert.title}</Text>
        <Text style={s.body}>{smsAlert.body}</Text>
        <View style={s.note}>
          <Feather name={smsAlert.via === 'link' ? 'link' : 'message-square'} size={14} color="#fff" />
          <Text style={s.noteText}>
            {smsAlert.via === 'link' ? 'Aberto pelo link do SMS' : 'Recebido por SMS'} · agenda atualizada sem internet
          </Text>
        </View>
        <Pressable onPress={dismissSmsAlert} accessibilityRole="button" style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}>
          <Text style={s.btnText}>Entendi</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(21,43,70,0.55)', justifyContent: 'flex-start', padding: 16, paddingTop: 56, zIndex: 50 },
  card: { backgroundColor: '#b42318', borderRadius: 14, padding: 18, gap: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, elevation: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kicker: { fontFamily: font.bold, fontSize: 13, letterSpacing: 1.2, color: '#fff' },
  title: { fontFamily: font.bold, fontSize: 19, color: '#fff' },
  body: { fontFamily: font.regular, fontSize: 15, color: '#fff', lineHeight: 22 },
  note: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.18)', padding: 10, borderRadius: 8 },
  noteText: { fontFamily: font.semi, fontSize: 12, color: '#fff', flex: 1 },
  btn: { backgroundColor: '#fff', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  btnText: { fontFamily: font.bold, fontSize: 15, color: '#b42318' },
});
