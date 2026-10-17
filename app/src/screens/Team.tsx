import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Badge, Button, Card, Empty, Screen, SectionTitle, SyncBar, common } from '../ui';
import { colors, font } from '../theme';
import { Game, NOW, fmtDateLong, gameDate, instructions, roster, teamName, transport, venueNames, venues } from '../data';
import { useStore } from '../store';
import { GameCard, GameDetailView, NoticeCard, NoticeDetailView, matchup } from './shared';

function useTeamData() {
  const { user, games, notices } = useStore();
  const teamId = user?.teamId;
  const myGames = useMemo(
    () => games.filter((g) => g.homeId === teamId || g.awayId === teamId).sort((a, b) => +gameDate(a) - +gameDate(b)),
    [games, teamId],
  );
  const next = myGames.find((g) => gameDate(g) >= NOW);
  const myNotices = useMemo(
    () => notices.filter((n) => n.target === 'all' || n.target.includes(teamId!)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notices, teamId],
  );
  return { teamId: teamId!, myGames, next, myNotices };
}

// ---------- Início ----------
export function Home({ navigation }: any) {
  const { user } = useStore();
  const { teamId, next, myNotices } = useTeamData();
  return (
    <Screen title={`Olá, ${user!.name.split(' ')[0]}`} subtitle={user!.title}>
      <SyncBar />
      <SectionTitle>Próximo jogo</SectionTitle>
      {next ? (
        <GameCard highlight g={next} onPress={() => navigation.navigate('Agenda', { screen: 'GameDetail', params: { id: next.id } })} />
      ) : (
        <Empty icon="calendar" text="Sem jogos futuros para a sua equipe." />
      )}
      {next && <Text style={common.muted}>{teamName(teamId)} · {fmtDateLong(next.date)}</Text>}
      <SectionTitle right={<Pressable onPress={() => navigation.navigate('Avisos')}><Text style={{ fontFamily: font.semi, color: colors.primary }}>Ver todos</Text></Pressable>}>
        Avisos recentes
      </SectionTitle>
      {myNotices.slice(0, 2).map((n) => (
        <NoticeCard key={n.id} n={n} onPress={() => navigation.navigate('Avisos', { screen: 'NoticeDetail', params: { id: n.id } })} />
      ))}
      {myNotices.length === 0 && <Empty icon="bell" text="Nenhum aviso para a sua equipe." />}
    </Screen>
  );
}

// ---------- Agenda ----------
const AgendaStack = createNativeStackNavigator();
function AgendaList({ navigation }: any) {
  const { myGames, next } = useTeamData();
  return (
    <Screen title="Agenda" subtitle="Jogos da sua equipe em ordem de data e horário.">
      <SyncBar />
      {myGames.length === 0 && <Empty icon="calendar" text="Sem jogos salvos. É necessário um primeiro acesso conectado." />}
      {myGames.map((g) => (
        <View key={g.id} style={{ gap: 6 }}>
          {next?.id === g.id && <Badge label="Próximo jogo" tone="primary" />}
          <GameCard g={g} highlight={next?.id === g.id} onPress={() => navigation.navigate('GameDetail', { id: g.id })} />
          {gameDate(g) < NOW && <Text style={common.muted}>Jogo já realizado ou em andamento</Text>}
        </View>
      ))}
    </Screen>
  );
}
function AgendaDetail({ route, navigation }: any) {
  const { games, user } = useStore();
  const g = games.find((x) => x.id === route.params.id) as Game | undefined;
  if (!g) return null;
  return (
    <GameDetailView
      g={g}
      onBack={navigation.goBack}
      footer={
        user?.role === 'coach' ? <Attendance g={g} /> : (
          <Card style={{ gap: 6 }}>
            <Text style={common.strong}>Antes do jogo</Text>
            <Text style={common.body}>Chegue 40 minutos antes para aquecimento. Uniforme completo e numerado.</Text>
          </Card>
        )
      }
    />
  );
}
export function Agenda() {
  return (
    <AgendaStack.Navigator screenOptions={{ headerShown: false }}>
      <AgendaStack.Screen name="AgendaList" component={AgendaList} />
      <AgendaStack.Screen name="GameDetail" component={AgendaDetail} />
    </AgendaStack.Navigator>
  );
}

function Attendance({ g }: { g: Game }) {
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(roster.map((r) => [r, true])));
  const [sent, setSent] = useState(false);
  const count = Object.values(on).filter(Boolean).length;
  return (
    <>
      <SectionTitle>Presença no jogo {g.code}</SectionTitle>
      <Card style={{ gap: 4 }}>
        {roster.map((name) => (
          <Pressable key={name} onPress={() => { setSent(false); setOn({ ...on, [name]: !on[name] }); }} accessibilityRole="checkbox" accessibilityState={{ checked: on[name] }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
            <Feather name={on[name] ? 'check-square' : 'square'} size={20} color={on[name] ? colors.primary : colors.muted} />
            <Text style={common.body}>{name}</Text>
          </Pressable>
        ))}
      </Card>
      <Button label={sent ? 'Lista confirmada' : `Confirmar ${count} atletas`} icon="check" onPress={() => setSent(true)} disabled={sent} />
      <Text style={common.muted}>Protótipo: a confirmação fica só neste aparelho.</Text>
    </>
  );
}

// ---------- Avisos ----------
const NoticeStack = createNativeStackNavigator();
function NoticeList({ navigation }: any) {
  const { myNotices } = useTeamData();
  return (
    <Screen title="Avisos" subtitle="Comunicados gerais e da sua equipe.">
      <SyncBar />
      {myNotices.map((n) => <NoticeCard key={n.id} n={n} onPress={() => navigation.navigate('NoticeDetail', { id: n.id })} />)}
      {myNotices.length === 0 && <Empty icon="bell" text="Nenhum aviso." />}
    </Screen>
  );
}
function NoticeDetail({ route, navigation }: any) {
  return <NoticeDetailView id={route.params.id} onBack={navigation.goBack} />;
}
export function Notices() {
  return (
    <NoticeStack.Navigator screenOptions={{ headerShown: false }}>
      <NoticeStack.Screen name="NoticeList" component={NoticeList} />
      <NoticeStack.Screen name="NoticeDetail" component={NoticeDetail} />
    </NoticeStack.Navigator>
  );
}

// ---------- Informações ----------
export function InfoScreen() {
  const { teamId, myGames } = useTeamData();
  const t = transport(teamId);
  const used = Array.from(new Set(myGames.map((g) => g.venue)));
  return (
    <Screen title="Informações" subtitle="Disponível sem internet após a atualização.">
      <SectionTitle>Transporte da equipe</SectionTitle>
      <Card style={{ gap: 12 }}>
        <Row icon="map-pin" label="Embarque" value={t.pickup} />
        <Row icon="clock" label="Saída" value={t.time} />
        <Row icon="flag" label="Destino" value={t.destination} />
        <Text style={common.muted}>{t.note}</Text>
      </Card>
      <SectionTitle>Locais dos seus jogos</SectionTitle>
      {(used.length ? used : venueNames).map((v) => (
        <Card key={v}><Text style={common.strong}>{v}</Text><Text style={[common.body, { marginTop: 4 }]}>{venues[v]}</Text></Card>
      ))}
      <SectionTitle>Instruções gerais</SectionTitle>
      {instructions.map((i) => (
        <Card key={i.title}><Text style={common.strong}>{i.title}</Text><Text style={[common.body, { marginTop: 4 }]}>{i.text}</Text></Card>
      ))}
    </Screen>
  );
}
function Row({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Feather name={icon} size={18} color={colors.primary} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}><Text style={common.muted}>{label}</Text><Text style={common.strong}>{value}</Text></View>
    </View>
  );
}

// ---------- Elenco (professor) ----------
export function Squad() {
  const { teamId, myGames } = useTeamData();
  return (
    <Screen title="Equipe" subtitle={`${teamName(teamId)} · ${myGames[0]?.sport ?? ''}`}>
      <SectionTitle>Elenco</SectionTitle>
      <Card style={{ gap: 2 }}>
        {roster.map((r, i) => (
          <View key={r} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i < roster.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: font.semi, fontSize: 12, color: colors.primary }}>{i + 1}</Text>
            </View>
            <Text style={common.body}>{r}</Text>
          </View>
        ))}
      </Card>
      <Text style={common.muted}>Alertas críticos por SMS são enviados ao professor responsável pela equipe.</Text>
    </Screen>
  );
}
