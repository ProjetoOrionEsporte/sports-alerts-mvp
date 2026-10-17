import React from 'react';
import {
  ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, font, radius } from './theme';
import { EVENT, fmtStamp } from './data';
import { useStore } from './store';

type Tone = 'neutral' | 'primary' | 'success' | 'warn' | 'danger';
const tones: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surface, fg: colors.muted },
  primary: { bg: colors.primarySoft, fg: colors.primary },
  success: { bg: colors.successBg, fg: colors.success },
  warn: { bg: colors.warnBg, fg: colors.warn },
  danger: { bg: colors.dangerBg, fg: colors.danger },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = tones[tone];
  return (
    <View style={[s.badge, { backgroundColor: t.bg }]}>
      <Text style={[s.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const Comp: any = onPress ? Pressable : View;
  return (
    <Comp onPress={onPress} style={[s.card, style]} accessibilityRole={onPress ? 'button' : undefined}>
      {children}
    </Comp>
  );
}

export function Button({
  label, onPress, variant = 'primary', icon, disabled,
}: { label: string; onPress: () => void; variant?: 'primary' | 'outline' | 'danger'; icon?: keyof typeof Feather.glyphMap; disabled?: boolean }) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.white;
  const fg = variant === 'outline' ? colors.primary : colors.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.btn, { backgroundColor: bg, borderColor: variant === 'outline' ? colors.border : bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}
    >
      {icon && <Feather name={icon} size={16} color={fg} />}
      <Text style={[s.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...p }: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        {...p}
        style={[s.input, p.multiline && { minHeight: 96, textAlignVertical: 'top' }, p.style]}
      />
    </View>
  );
}

export function Segmented<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={s.seg}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[s.segItem, on && s.segOn]}
          >
            <Text style={[s.segText, on && { color: colors.primary }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityState={{ selected: on }} style={[s.chip, on && s.chipOn]}>
      <Text style={[s.chipText, on && { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
      <Text style={s.section}>{children}</Text>
      {right}
    </View>
  );
}

export function Empty({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={{ alignItems: 'center', padding: 32, gap: 10 }}>
      <Feather name={icon} size={28} color={colors.muted} />
      <Text style={[s.body, { textAlign: 'center', color: colors.muted }]}>{text}</Text>
    </View>
  );
}

/** Barra de conexão/sincronização para atleta e professor. */
export function SyncBar() {
  const { online, setOnline, lastSync, sync, syncing, syncError, hasPending, smsUpdate, dismissSmsUpdate, smsStatus, applySms } = useStore();
  const [paste, setPaste] = React.useState('');
  const [pasteMsg, setPasteMsg] = React.useState<string | null>(null);
  return (
    <View style={{ gap: 8 }}>
      <View style={[s.sync, { backgroundColor: online ? colors.successBg : colors.warnBg }]}>
        <Feather name={online ? 'wifi' : 'wifi-off'} size={16} color={online ? colors.success : colors.warn} />
        <View style={{ flex: 1 }}>
          <Text style={[s.syncTitle, { color: online ? colors.success : colors.warn }]}>{online ? 'Conectado' : 'Sem internet'}</Text>
          <Text style={s.syncSub}>
            {lastSync ? `Última atualização: ${fmtStamp(lastSync)}` : 'Sem dados salvos'}
            {!online ? ' · os dados podem estar desatualizados' : ''}
          </Text>
        </View>
        <Pressable onPress={sync} disabled={syncing} accessibilityRole="button" style={s.syncBtn}>
          {syncing ? <ActivityIndicator size="small" color={colors.primary} /> : <Feather name="refresh-cw" size={14} color={colors.primary} />}
          <Text style={s.syncBtnText}>Atualizar</Text>
        </Pressable>
      </View>
      {hasPending && online && !syncing && (
        <Text style={s.hint}>Há novidades da organização. Toque em Atualizar para receber a programação e os avisos mais recentes.</Text>
      )}
      {syncError && <Text style={[s.hint, { color: colors.danger }]}>{syncError}</Text>}
      {smsUpdate && (
        <View style={[s.sync, { backgroundColor: colors.primarySoft, alignItems: 'flex-start' }]}>
          <Feather name="message-square" size={16} color={colors.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={[s.syncTitle, { color: colors.primary }]}>Atualizado por SMS, sem internet</Text>
            <Text style={s.syncSub}>{smsUpdate}</Text>
          </View>
          <Pressable onPress={dismissSmsUpdate} accessibilityLabel="Dispensar" hitSlop={8}><Feather name="x" size={16} color={colors.muted} /></Pressable>
        </View>
      )}
      {smsStatus !== 'unavailable' && (
        <Text style={s.demoText}>
          {smsStatus === 'on' ? 'Recebimento de SMS do evento: ativo.' : 'Recebimento de SMS bloqueado. Autorize "SMS" nas permissões do app para atualizar sem internet.'}
        </Text>
      )}
      <View style={{ gap: 6 }}>
        <Text style={s.demoText}>Demonstração: colar o texto de um SMS recebido</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={paste}
            onChangeText={(v) => { setPaste(v); setPasteMsg(null); }}
            placeholder="Cole o SMS aqui"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Texto do SMS"
            style={[s.input, { flex: 1, paddingVertical: 8, fontSize: 13 }]}
          />
          <Pressable
            onPress={() => {
              const r = applySms(paste);
              setPasteMsg(r === 'applied' ? 'SMS aplicado.' : r === 'duplicate' ? 'Esse SMS já foi aplicado.' : r === 'unknown-game' ? 'Jogo desse SMS não está salvo neste aparelho.' : 'Texto não reconhecido como SMS do evento.');
              if (r === 'applied') setPaste('');
            }}
            accessibilityRole="button"
            style={s.syncBtn}
          >
            <Text style={s.syncBtnText}>Aplicar</Text>
          </Pressable>
        </View>
        {pasteMsg && <Text style={s.hint}>{pasteMsg}</Text>}
      </View>
      <Pressable onPress={() => setOnline(!online)} accessibilityRole="switch" accessibilityState={{ checked: !online }} style={s.demoToggle}>
        <Feather name={online ? 'toggle-left' : 'toggle-right'} size={18} color={colors.muted} />
        <Text style={s.demoText}>Demonstração: simular perda de internet</Text>
      </Pressable>
    </View>
  );
}

/** Estrutura padrão de tela: cabeçalho do evento + conteúdo rolável. */
export function Screen({
  title, subtitle, children, onBack, scroll = true, right,
}: { title: string; subtitle?: string; children: React.ReactNode; onBack?: () => void; scroll?: boolean; right?: React.ReactNode }) {
  const { user, logout } = useStore();
  const body = <View style={s.body_}>{children}</View>;
  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.top}>
        {onBack ? (
          <Pressable onPress={onBack} accessibilityLabel="Voltar" hitSlop={10} style={s.back}>
            <Feather name="chevron-left" size={22} color={colors.ink} />
          </Pressable>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.event}>{EVENT.name}</Text>
              <Badge label={EVENT.status} tone="success" />
            </View>
          </View>
        )}
        {onBack && <View style={{ flex: 1 }} />}
        {user && (
          <Pressable onPress={logout} accessibilityLabel="Sair" style={s.profile}>
            <View style={s.avatar}><Text style={s.avatarText}>{user.initials}</Text></View>
            <Feather name="log-out" size={16} color={colors.muted} />
          </Pressable>
        )}
      </View>
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <View style={s.titleBox}>
            <View style={{ flex: 1 }}>
              <Text style={s.h1}>{title}</Text>
              {subtitle && <Text style={s.sub}>{subtitle}</Text>}
            </View>
            {right}
          </View>
          {body}
        </ScrollView>
      ) : (
        <>{body}</>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface, ...(Platform.OS === 'web' ? { maxHeight: '100vh' as any } : null) },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  event: { fontFamily: font.semi, fontSize: 16, color: colors.ink },
  back: { width: 32, height: 32, justifyContent: 'center' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.semi, fontSize: 12, color: colors.primary },
  titleBox: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 12 },
  h1: { fontFamily: font.bold, fontSize: 26, color: colors.ink },
  sub: { fontFamily: font.regular, fontSize: 14, color: colors.muted, marginTop: 4 },
  body_: { paddingHorizontal: 20, gap: 14 },
  body: { fontFamily: font.regular, fontSize: 14, color: colors.ink, lineHeight: 21 },
  section: { fontFamily: font.semi, fontSize: 17, color: colors.ink },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: 16 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.chip, alignSelf: 'flex-start' },
  badgeText: { fontFamily: font.semi, fontSize: 12 },
  btn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, paddingHorizontal: 16, borderRadius: radius.field, borderWidth: 1, minHeight: 46 },
  btnText: { fontFamily: font.semi, fontSize: 14 },
  label: { fontFamily: font.semi, fontSize: 13, color: colors.ink },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.field, paddingHorizontal: 12, paddingVertical: 12, fontFamily: font.regular, fontSize: 15, color: colors.ink, backgroundColor: colors.white },
  seg: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.field, padding: 3, borderWidth: 1, borderColor: colors.border },
  segItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  segOn: { backgroundColor: colors.white },
  segText: { fontFamily: font.semi, fontSize: 13, color: colors.muted },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { fontFamily: font.semi, fontSize: 13, color: colors.muted },
  sync: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.card },
  syncTitle: { fontFamily: font.semi, fontSize: 13 },
  syncSub: { fontFamily: font.regular, fontSize: 12, color: colors.muted },
  syncBtn: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.field, borderWidth: 1, borderColor: colors.border },
  syncBtnText: { fontFamily: font.semi, fontSize: 12, color: colors.primary },
  hint: { fontFamily: font.regular, fontSize: 12, color: colors.primary },
  demoToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  demoText: { fontFamily: font.regular, fontSize: 12, color: colors.muted },
});

export const common = StyleSheet.create({
  muted: { fontFamily: font.regular, fontSize: 13, color: colors.muted },
  strong: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
  body: s.body,
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
