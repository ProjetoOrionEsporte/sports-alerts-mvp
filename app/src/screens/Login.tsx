import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, font, radius } from '../theme';
import { EVENT, Role, users } from '../data';
import { useStore } from '../store';
import { Card } from '../ui';

const meta: Record<Role, { icon: keyof typeof Feather.glyphMap; label: string; desc: string }> = {
  athlete: { icon: 'user', label: 'Atleta', desc: 'Veja seus jogos, avisos e o transporte da equipe.' },
  coach: { icon: 'clipboard', label: 'Professor', desc: 'Acompanhe a agenda, o elenco e os comunicados da equipe.' },
  admin: { icon: 'shield', label: 'Administração', desc: 'Altere jogos, publique avisos e acompanhe os SMS.' },
};

export default function Login() {
  const { login } = useStore();
  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }}>
        <View style={s.brand}>
          <View style={s.logo}><Feather name="layout" size={22} color={colors.white} /></View>
          <Text style={s.brandText}>Arena Connect</Text>
        </View>
        <View>
          <Text style={s.h1}>Entrar</Text>
          <Text style={s.sub}>{EVENT.name} · escolha um perfil de demonstração. Cadastro e senha não fazem parte do protótipo.</Text>
        </View>
        {users.map((u) => {
          const m = meta[u.role];
          return (
            <Card key={u.id} onPress={() => login(u)} style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <View style={s.icon}><Feather name={m.icon} size={20} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.role}>{m.label}</Text>
                <Text style={s.name}>{u.name}</Text>
                <Text style={s.desc}>{m.desc}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.muted} />
            </Card>
          );
        })}
        <Text style={s.note}>O primeiro acesso baixa os dados do evento e exige conexão. Depois, a consulta funciona sem internet.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  logo: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontFamily: font.bold, fontSize: 20, color: colors.ink },
  h1: { fontFamily: font.bold, fontSize: 28, color: colors.ink, marginTop: 12 },
  sub: { fontFamily: font.regular, fontSize: 14, color: colors.muted, marginTop: 6, lineHeight: 20 },
  icon: { width: 44, height: 44, borderRadius: radius.card, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  role: { fontFamily: font.semi, fontSize: 12, color: colors.primary },
  name: { fontFamily: font.semi, fontSize: 16, color: colors.ink },
  desc: { fontFamily: font.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  note: { fontFamily: font.regular, fontSize: 12, color: colors.muted, textAlign: 'center' },
});
