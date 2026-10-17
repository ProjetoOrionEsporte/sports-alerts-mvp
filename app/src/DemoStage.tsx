import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, font } from './theme';

// Modo apresentação (?demo=1): dois aparelhos lado a lado na mesma página, ligados por um
// "servidor" e uma "operadora de SMS" simulados no localStorage do navegador.
const PHONE_W = 380;
const PHONE_H = 780;

const steps = [
  { who: 'Professor', text: 'Está sem internet: toque em "Demonstração: simular perda de internet".' },
  { who: 'Organização', text: 'Programação → #040 Chapecó × Itajaí → Alterar jogo. Mude para 14:30 e Arena Multiuso, prioridade Crítica → Revisar → Confirmar e publicar.' },
  { who: 'Professor', text: 'O SMS chega pela rede celular: alerta na tela e agenda atualizada mesmo offline.' },
  { who: 'Organização', text: 'Avisos → aviso do #040: Chapecó "Aceito para envio"; Itajaí "Falhou" (sem telefone) → Tentar novamente.' },
  { who: 'Professor', text: 'Volta a internet → Atualizar: recebe os dados oficiais, sem duplicar o aviso.' },
];

function Phone({ src, label, sub, version }: { src: string; label: string; sub: string; version: number }) {
  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <View>
        <Text style={s.phoneLabel}>{label}</Text>
        <Text style={s.phoneSub}>{sub}</Text>
      </View>
      <View style={s.phone}>
        {React.createElement('iframe', {
          key: version,
          src,
          title: label,
          style: { width: PHONE_W, height: PHONE_H, border: 0, borderRadius: 28, background: '#fff' },
          allow: 'autoplay; vibrate',
        })}
      </View>
    </View>
  );
}

export default function DemoStage() {
  const { width, height } = useWindowDimensions();
  const [version, setVersion] = useState(0);
  const wide = width >= 1180;
  // Cabe numa tela de projetor sem rolagem: reduz os aparelhos se a altura for pequena.
  const scale = Math.min(1, (height - 120) / (PHONE_H + 70));

  const reset = () => {
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('arena-connect:')).forEach((k) => localStorage.removeItem(k));
    } catch {}
    setVersion((v) => v + 1);
  };

  const phones = (
    <View style={[s.phones, { transform: [{ scale }] }]}>
      <Phone version={version} src="/?device=admin&as=admin" label="Organização" sub="Mariana · online" />
      <View style={s.link}>
        <Feather name="message-square" size={22} color="#9fb4d1" />
        <Text style={s.linkText}>SMS pela{'\n'}rede celular</Text>
      </View>
      <Phone version={version} src="/?device=prof&as=coach" label="Professor · Chapecó" sub="Rafael · recebe o SMS" />
    </View>
  );

  return (
    <ScrollView style={s.stage} contentContainerStyle={[s.content, !wide && { flexDirection: 'column', alignItems: 'center' }]}>
      <View style={[s.side, !wide && { width: '100%', maxWidth: 820 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={s.logo}><Feather name="layout" size={18} color="#fff" /></View>
          <Text style={s.brand}>Arena Connect</Text>
        </View>
        <Text style={s.h1}>Mudou o jogo? A equipe fica sabendo — mesmo sem internet.</Text>
        <Text style={s.lead}>
          A organização altera horário ou local. O app publica o aviso e, se for crítico, dispara SMS ao professor.
          O SMS chega pela rede celular e atualiza a agenda guardada no aparelho.
        </Text>
        <Text style={s.section}>Roteiro (1 minuto)</Text>
        {steps.map((st, i) => (
          <View key={i} style={s.step}>
            <View style={s.num}><Text style={s.numText}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.who}>{st.who}</Text>
              <Text style={s.stepText}>{st.text}</Text>
            </View>
          </View>
        ))}
        <Pressable onPress={reset} accessibilityRole="button" style={({ pressed }) => [s.reset, pressed && { opacity: 0.8 }]}>
          <Feather name="rotate-ccw" size={16} color={colors.ink} />
          <Text style={s.resetText}>Reiniciar demonstração</Text>
        </Pressable>
        <Text style={s.foot}>Servidor e operadora simulados no navegador. Prova real: abra o app no celular e use "Enviar SMS real".</Text>
      </View>
      {wide ? phones : <ScrollView horizontal contentContainerStyle={{ paddingHorizontal: 16 }}>{phones}</ScrollView>}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  stage: { flex: 1, backgroundColor: '#0f1f33' },
  content: { flexDirection: 'row', gap: 40, padding: 32, alignItems: 'flex-start', justifyContent: 'center', minHeight: '100%' as any },
  side: { width: 380, gap: 14, paddingTop: 8 },
  logo: { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: font.bold, fontSize: 18, color: '#fff' },
  h1: { fontFamily: font.bold, fontSize: 28, lineHeight: 34, color: '#fff', marginTop: 8 },
  lead: { fontFamily: font.regular, fontSize: 15, lineHeight: 23, color: '#c4d2e4' },
  section: { fontFamily: font.semi, fontSize: 13, letterSpacing: 1, color: '#9fb4d1', marginTop: 10, textTransform: 'uppercase' },
  step: { flexDirection: 'row', gap: 12 },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  numText: { fontFamily: font.bold, fontSize: 13, color: '#fff' },
  who: { fontFamily: font.semi, fontSize: 12, color: '#9fb4d1' },
  stepText: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: '#fff' },
  reset: { flexDirection: 'row', gap: 8, alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  resetText: { fontFamily: font.semi, fontSize: 14, color: colors.ink },
  foot: { fontFamily: font.regular, fontSize: 12, color: '#7f94b1', lineHeight: 18 },
  phones: { flexDirection: 'row', alignItems: 'center', gap: 20, transformOrigin: 'top center' as any },
  phone: { padding: 10, backgroundColor: '#05101d', borderRadius: 38, borderWidth: 2, borderColor: '#2a3d57' },
  phoneLabel: { fontFamily: font.bold, fontSize: 16, color: '#fff', textAlign: 'center' },
  phoneSub: { fontFamily: font.regular, fontSize: 12, color: '#9fb4d1', textAlign: 'center' },
  link: { alignItems: 'center', gap: 6, paddingTop: 40 },
  linkText: { fontFamily: font.semi, fontSize: 11, color: '#9fb4d1', textAlign: 'center' },
});
