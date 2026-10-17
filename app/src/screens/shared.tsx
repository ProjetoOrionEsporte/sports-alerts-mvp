import React from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { openSmsComposer } from '../composer';
import { Badge, Button, Card, Screen, SectionTitle, common } from '../ui';
import { colors, font } from '../theme';
import { Game, Notice, fmtDateLong, fmtDateShort, fmtStamp, fmtTime, teamName, venues } from '../data';
import { useStore } from '../store';

export const matchup = (g: Game) => `${teamName(g.homeId)} × ${teamName(g.awayId)}`;

export function GameCard({ g, onPress, highlight, action }: { g: Game; onPress?: () => void; highlight?: boolean; action?: React.ReactNode }) {
  return (
    <Card onPress={onPress} style={highlight ? { backgroundColor: colors.primarySoft } : undefined}>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <View style={{ width: 62 }}>
          <Text style={{ fontFamily: font.semi, fontSize: 17, color: colors.ink }}>{fmtTime(g.time)}</Text>
          <Text style={common.muted}>{g.date.slice(8)}/{g.date.slice(5, 7)}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={common.muted}>{g.sport} · {g.code}</Text>
          <Text style={{ fontFamily: font.semi, fontSize: 15, color: colors.ink }}>{matchup(g)}</Text>
          <Text style={common.muted}>{g.venue} · {g.phase}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <Badge label={g.status} tone={g.status === 'Alterado' ? 'warn' : 'neutral'} />
          </View>
          {action}
        </View>
      </View>
    </Card>
  );
}

export function GameDetailView({ g, onBack, footer }: { g: Game; onBack: () => void; footer?: React.ReactNode }) {
  return (
    <Screen title={matchup(g)} subtitle={`${g.sport} · ${g.code} · ${g.phase}`} onBack={onBack}>
      {g.status === 'Alterado' && g.prev && (
        <Card style={{ backgroundColor: colors.warnBg, borderColor: '#f3d9a4' }}>
          <View style={common.row}>
            <Feather name="alert-triangle" size={16} color={colors.warn} />
            <Text style={{ fontFamily: font.semi, color: colors.warn }}>Horário ou local alterado</Text>
          </View>
          <Text style={[common.body, { marginTop: 6 }]}>
            Antes: {fmtDateShort(g.prev.date)} às {fmtTime(g.prev.time)} · {g.prev.venue}
          </Text>
          {g.changeNote && <Text style={[common.body, { marginTop: 4 }]}>{g.changeNote}</Text>}
        </Card>
      )}
      <Card style={{ gap: 14 }}>
        <Info icon="calendar" label="Data" value={fmtDateLong(g.date)} />
        <Info icon="clock" label="Horário (Brasília)" value={fmtTime(g.time)} />
        <Info icon="map-pin" label="Local" value={g.venue} extra={venues[g.venue]} />
        <Info icon="flag" label="Fase" value={g.phase} />
      </Card>
      {footer}
    </Screen>
  );
}

function Info({ icon, label, value, extra }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; extra?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Feather name={icon} size={18} color={colors.primary} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={common.muted}>{label}</Text>
        <Text style={common.strong}>{value}</Text>
        {extra && <Text style={[common.muted, { marginTop: 2 }]}>{extra}</Text>}
      </View>
    </View>
  );
}

export const priorityLabel = (p: Notice['priority']) => (p === 'critical' ? 'Crítico' : 'Normal');

export function NoticeCard({ n, onPress }: { n: Notice; onPress: () => void }) {
  return (
    <Card onPress={onPress} style={n.priority === 'critical' ? { borderColor: '#f1b5b0' } : undefined}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <Badge label={priorityLabel(n.priority)} tone={n.priority === 'critical' ? 'danger' : 'neutral'} />
        <Badge label={n.kind} tone="primary" />
      </View>
      <Text style={common.strong}>{n.title}</Text>
      <Text style={[common.body, { marginTop: 4 }]} numberOfLines={2}>{n.body}</Text>
      <Text style={[common.muted, { marginTop: 8 }]}>{fmtStamp(n.createdAt)} · {n.target === 'all' ? 'Todas as equipes' : n.target.map(teamName).join(', ')}</Text>
    </Card>
  );
}

export function NoticeDetailView({ id, onBack, admin }: { id: string; onBack: () => void; admin?: boolean }) {
  const { notices, sms, retrySms, online, markSmsChip } = useStore();
  const [hint, setHint] = React.useState<string | null>(null);
  const sendReal = async (id: string, text: string) => {
    try {
      const r = await openSmsComposer(text);
      if (r === 'unavailable') return setHint('Abra esta tela no celular para enviar o SMS pelo chip.');
      markSmsChip(id, r === 'sent' ? 'Enviado pelo aparelho' : 'Composição aberta');
    } catch {}
  };
  const n = notices.find((x) => x.id === id);
  if (!n) return <Screen title="Aviso" onBack={onBack}><Text style={common.body}>Aviso não encontrado.</Text></Screen>;
  const reqs = sms.filter((r) => r.noticeId === n.id);
  return (
    <Screen title={n.title} subtitle={`${fmtStamp(n.createdAt)} · ${n.author}`} onBack={onBack}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Badge label={`Prioridade: ${priorityLabel(n.priority)}`} tone={n.priority === 'critical' ? 'danger' : 'neutral'} />
        <Badge label={n.kind} tone="primary" />
      </View>
      <Card><Text style={common.body}>{n.body}</Text></Card>
      <Text style={common.muted}>Para: {n.target === 'all' ? 'todas as equipes' : n.target.map(teamName).join(', ')}</Text>
      {admin && n.priority === 'critical' && (
        <>
          <SectionTitle>Acompanhamento de SMS</SectionTitle>
          <Text style={common.muted}>"Aceito para envio" indica que o provedor recebeu a solicitação. Não confirma entrega nem leitura.</Text>
          {reqs.length === 0 && <Text style={common.body}>Nenhuma solicitação de SMS registrada.</Text>}
          {hint && <Text style={[common.body, { color: colors.primary }]}>{hint}</Text>}
          {reqs.map((r) => (
            <Card key={r.id} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={common.strong}>{teamName(r.teamId)} · {r.recipient}</Text>
                <Badge label={r.state} tone={r.state === 'Falhou' ? 'danger' : 'success'} />
              </View>
              <Text style={common.muted}>{r.phone || 'Sem telefone'}</Text>
              {r.reason && <Text style={[common.body, { color: colors.danger }]}>{r.reason}</Text>}
              {r.chip && <Text style={common.muted}>{r.chip}. Entrega e leitura não são confirmadas.</Text>}
              {r.state === 'Aceito para envio' && <Button variant="outline" icon="smartphone" label="Enviar SMS real por este celular" onPress={() => sendReal(r.id, r.text)} />}
              {r.state === 'Falhou' && <Button variant="outline" icon="refresh-cw" label="Tentar novamente" disabled={!online} onPress={() => retrySms(r.id)} />}
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
