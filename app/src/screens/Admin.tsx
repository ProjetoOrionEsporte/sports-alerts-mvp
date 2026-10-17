import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Badge, Button, Card, Chip, Empty, Field, Screen, Segmented, SectionTitle, common } from '../ui';
import { colors, font } from '../theme';
import { Game, Priority, fmtDateLong, fmtDateShort, fmtTime, gameDate, teamName, teams, venueNames } from '../data';
import { useStore } from '../store';
import { GameCard, NoticeCard, NoticeDetailView, matchup } from './shared';

const OfflineBanner = () => {
  const { online, setOnline } = useStore();
  return (
    <Pressable onPress={() => setOnline(!online)} accessibilityRole="switch" style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <Feather name={online ? 'toggle-left' : 'toggle-right'} size={18} color={online ? colors.muted : colors.warn} />
      <Text style={{ fontFamily: font.regular, fontSize: 12, color: online ? colors.muted : colors.warn }}>
        {online ? 'Demonstração: simular perda de internet' : 'Sem internet: edição e publicação bloqueadas'}
      </Text>
    </Pressable>
  );
};

// ---------- Programação (Figma) ----------
const GamesStack = createNativeStackNavigator();
function GamesList({ navigation }: any) {
  const { games } = useStore();
  const sports = useMemo(() => ['Todas', ...Array.from(new Set(games.map((g) => g.sport)))], [games]);
  const dates = useMemo(() => Array.from(new Set(games.map((g) => g.date))).sort(), [games]);
  const [q, setQ] = useState('');
  const [sport, setSport] = useState('Todas');
  const [date, setDate] = useState(dates[0]);
  const list = games
    .filter((g) => g.date === date)
    .filter((g) => sport === 'Todas' || g.sport === sport)
    .filter((g) => !q.trim() || `${matchup(g)} ${g.code} ${g.sport}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => +gameDate(a) - +gameDate(b));
  return (
    <Screen title="Programação" subtitle="Consulte os jogos e mantenha a programação atualizada.">
      <OfflineBanner />
      <Card style={{ gap: 12 }}>
        <Field label="Buscar" value={q} onChangeText={setQ} placeholder="Jogo, equipe ou município" />
        <Text style={common.strong}>Data</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {dates.map((d) => <Chip key={d} label={fmtDateShort(d)} on={d === date} onPress={() => setDate(d)} />)}
        </View>
        <Text style={common.strong}>Modalidade</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {sports.map((sp) => <Chip key={sp} label={sp} on={sp === sport} onPress={() => setSport(sp)} />)}
        </View>
        <Text style={common.muted}>{list.length} jogos encontrados · {fmtDateLong(date)}</Text>
      </Card>
      <Card style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: font.semi, fontSize: 17, color: colors.ink }}>{fmtDateLong(date)}</Text>
            <Text style={common.muted}>{list.length} jogos · Horário de Brasília</Text>
          </View>
          <Badge label="Programação oficial" tone="primary" />
        </View>
      </Card>
      {list.length === 0 && <Empty icon="search" text="Nenhum jogo com esses filtros." />}
      {list.map((g) => (
        <GameCard
          key={g.id}
          g={g}
          action={
            <Pressable onPress={() => navigation.navigate('EditGame', { id: g.id })} accessibilityRole="button" style={{ flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: 8 }}>
              <Feather name="edit" size={15} color={colors.primary} />
              <Text style={{ fontFamily: font.semi, fontSize: 13, color: colors.primary }}>Alterar jogo</Text>
            </Pressable>
          }
        />
      ))}
    </Screen>
  );
}

// ---------- Alterar jogo ----------
const timeOk = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
const dateOk = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(+new Date(`${d}T12:00:00`));

function EditGame({ route, navigation }: any) {
  const { games, publishChange, online } = useStore();
  const g = games.find((x) => x.id === route.params.id) as Game;
  const [date, setDate] = useState(g.date);
  const [time, setTime] = useState(g.time);
  const [venue, setVenue] = useState(g.venue);
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [review, setReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const errs = [!dateOk(date) && 'Data no formato AAAA-MM-DD.', !timeOk(time) && 'Horário no formato HH:mm.', !venue && 'Escolha o local.'].filter(Boolean) as string[];
  const changed = date !== g.date || time !== g.time || venue !== g.venue;

  const goReview = () => {
    if (errs.length) return setError(errs.join(' '));
    if (!changed) return setError('Altere data, horário ou local para publicar.');
    setError(null);
    setReview(true);
  };
  const publish = () => {
    const r = publishChange(g.id, { date, time, venue, note: note.trim(), priority });
    if (!r.ok) return setError(r.error!);
    setDone(true);
  };

  if (done) {
    return (
      <Screen title="Alteração publicada" onBack={() => navigation.popToTop()}>
        <Card style={{ gap: 10, alignItems: 'center' }}>
          <Feather name="check-circle" size={34} color={colors.success} />
          <Text style={[common.strong, { textAlign: 'center' }]}>Jogo {g.code} salvo e aviso gerado para {teamName(g.homeId)} e {teamName(g.awayId)}.</Text>
          {priority === 'critical' && <Text style={[common.body, { textAlign: 'center' }]}>SMS solicitado aos responsáveis. Veja o resultado no detalhe do aviso, em Avisos.</Text>}
        </Card>
        <Button label="Voltar à programação" onPress={() => navigation.popToTop()} />
      </Screen>
    );
  }

  return (
    <Screen title={review ? 'Revisar alteração' : 'Alterar jogo'} subtitle={`${g.code} · ${matchup(g)} · ${g.sport}`} onBack={review ? () => setReview(false) : navigation.goBack}>
      {!online && <Card style={{ backgroundColor: colors.warnBg }}><Text style={common.body}>Sem internet. A edição exige conexão.</Text></Card>}
      {!review ? (
        <>
          <Card style={{ gap: 6 }}>
            <Text style={common.muted}>Dados atuais</Text>
            <Text style={common.strong}>{fmtDateShort(g.date)} às {fmtTime(g.time)} · {g.venue}</Text>
          </Card>
          <Field label="Nova data (AAAA-MM-DD)" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
          <Field label="Novo horário (HH:mm)" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" />
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: font.semi, fontSize: 13, color: colors.ink }}>Local</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {venueNames.map((v) => <Chip key={v} label={v} on={v === venue} onPress={() => setVenue(v)} />)}
            </View>
          </View>
          <Field label="Motivo ou orientação (opcional)" value={note} onChangeText={setNote} multiline placeholder="Ex.: chuva na quadra externa." />
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: font.semi, fontSize: 13, color: colors.ink }}>Prioridade</Text>
            <Segmented value={priority} onChange={setPriority} options={[{ value: 'normal', label: 'Normal' }, { value: 'critical', label: 'Crítica (envia SMS)' }]} />
          </View>
          {error && <Text style={{ fontFamily: font.semi, color: colors.danger }}>{error}</Text>}
          <Button label="Revisar alteração" icon="arrow-right" onPress={goReview} />
        </>
      ) : (
        <>
          <Card style={{ gap: 10 }}>
            <Text style={common.muted}>Antes</Text>
            <Text style={common.strong}>{fmtDateShort(g.date)} às {fmtTime(g.time)} · {g.venue}</Text>
            <Text style={common.muted}>Depois</Text>
            <Text style={[common.strong, { color: colors.primary }]}>{fmtDateShort(date)} às {fmtTime(time)} · {venue}</Text>
            {note.trim() !== '' && <Text style={common.body}>Motivo: {note.trim()}</Text>}
          </Card>
          <Card style={{ gap: 6 }}>
            <Text style={common.strong}>Equipes afetadas</Text>
            <Text style={common.body}>{teamName(g.homeId)} e {teamName(g.awayId)} receberão um aviso.</Text>
            <Badge label={`Prioridade: ${priority === 'critical' ? 'Crítica' : 'Normal'}`} tone={priority === 'critical' ? 'danger' : 'neutral'} />
            {priority === 'critical' && <Text style={common.muted}>O sistema solicitará SMS aos responsáveis. Uma falha no SMS não desfaz a alteração.</Text>}
          </Card>
          {error && <Text style={{ fontFamily: font.semi, color: colors.danger }}>{error}</Text>}
          <Button label="Confirmar e publicar" icon="send" onPress={publish} disabled={!online} />
          <Button label="Voltar e editar" variant="outline" onPress={() => setReview(false)} />
        </>
      )}
    </Screen>
  );
}

export function AdminGames() {
  return (
    <GamesStack.Navigator screenOptions={{ headerShown: false }}>
      <GamesStack.Screen name="GamesList" component={GamesList} />
      <GamesStack.Screen name="EditGame" component={EditGame} />
    </GamesStack.Navigator>
  );
}

// ---------- Avisos (admin) ----------
const NStack = createNativeStackNavigator();
function AdminNoticeList({ navigation }: any) {
  const { notices } = useStore();
  const list = [...notices].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <Screen title="Avisos" subtitle="Comunicados publicados e resultado dos SMS.">
      <OfflineBanner />
      <Button label="Novo aviso" icon="plus" onPress={() => navigation.navigate('NewNotice')} />
      {list.map((n) => <NoticeCard key={n.id} n={n} onPress={() => navigation.navigate('NoticeDetail', { id: n.id })} />)}
      <Text style={common.muted}>Avisos publicados não são editados nem excluídos. Corrija com um novo comunicado.</Text>
    </Screen>
  );
}
function AdminNoticeDetail({ route, navigation }: any) {
  return <NoticeDetailView admin id={route.params.id} onBack={navigation.goBack} />;
}
function NewNotice({ navigation }: any) {
  const { publishNotice, online } = useStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [all, setAll] = useState(true);
  const [sel, setSel] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    if (!title.trim() || !body.trim()) return setError('Informe título e mensagem.');
    if (!all && sel.length === 0) return setError('Escolha ao menos uma equipe.');
    const r = publishNotice({ title: title.trim(), body: body.trim(), priority, target: all ? 'all' : sel });
    if (!r.ok) return setError(r.error!);
    navigation.goBack();
  };
  return (
    <Screen title="Novo aviso" onBack={navigation.goBack}>
      <Field label="Título" value={title} onChangeText={setTitle} />
      <Field label="Mensagem" value={body} onChangeText={setBody} multiline />
      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: font.semi, fontSize: 13, color: colors.ink }}>Destinatários</Text>
        <Segmented value={all ? 'all' : 'some'} onChange={(v) => setAll(v === 'all')} options={[{ value: 'all', label: 'Todas as equipes' }, { value: 'some', label: 'Equipes específicas' }]} />
        {!all && (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {teams.map((t) => <Chip key={t.id} label={t.name} on={sel.includes(t.id)} onPress={() => setSel(sel.includes(t.id) ? sel.filter((x) => x !== t.id) : [...sel, t.id])} />)}
          </View>
        )}
      </View>
      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: font.semi, fontSize: 13, color: colors.ink }}>Prioridade</Text>
        <Segmented value={priority} onChange={setPriority} options={[{ value: 'normal', label: 'Normal' }, { value: 'critical', label: 'Crítica (envia SMS)' }]} />
      </View>
      {error && <Text style={{ fontFamily: font.semi, color: colors.danger }}>{error}</Text>}
      <Button label="Publicar aviso" icon="send" onPress={submit} disabled={!online} />
      {!online && <Text style={common.muted}>Sem internet: publicação bloqueada.</Text>}
    </Screen>
  );
}
export function AdminNotices() {
  return (
    <NStack.Navigator screenOptions={{ headerShown: false }}>
      <NStack.Screen name="AdminNoticeList" component={AdminNoticeList} />
      <NStack.Screen name="NoticeDetail" component={AdminNoticeDetail} />
      <NStack.Screen name="NewNotice" component={NewNotice} />
    </NStack.Navigator>
  );
}
