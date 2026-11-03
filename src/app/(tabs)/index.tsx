import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Button, Card, ExerciseImage, IconButton, ProgressBar, Txt } from '@/components/ui';
import { WeekStrip } from '@/components/WeekStrip';
import { useNow } from '@/lib/platform';
import type { Plan, Session } from '@/lib/types';
import { countSets, daysAgo, formatClock, formatKg, nextPlan, sessionVolume, volumeChange } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, fonts, radius } from '@/theme';

const greeting = (h: number) => (h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite');
const plannedSets = (p: Plan) => p.exercises.reduce((n, e) => n + e.sets, 0);

function Letter({ name, size = 64 }: { name: string; size?: number }) {
  return (
    <View style={[s.letter, { width: size, height: size, borderRadius: size / 4 }]}>
      <Txt style={[s.letterText, { fontSize: size * 0.62, lineHeight: size * 0.75 }]}>{name}</Txt>
    </View>
  );
}

function ActiveCard({ session }: { session: Session }) {
  const now = useNow();
  const { done, total } = countSets(session);
  return (
    <Card style={s.hero}>
      <View style={s.kickerRow}>
        <View style={s.liveDot} />
        <Txt v="label" style={{ color: colors.accent }}>Em andamento</Txt>
      </View>
      <View style={s.heroHead}>
        <Letter name={session.planName} />
        <View style={{ flex: 1 }}>
          <Txt v="title" numberOfLines={2}>{session.planTitle || `Ficha ${session.planName}`}</Txt>
          <Txt v="sub">{done} de {total} séries · {formatClock(now - session.startedAt)}</Txt>
        </View>
      </View>
      <ProgressBar value={total ? done / total : 0} />
      <Button label="Continuar treino" icon="play" onPress={() => router.push('/treino')} />
    </Card>
  );
}

function NextCard({ plan, onStart }: { plan: Plan; onStart: () => void }) {
  const shown = plan.exercises.slice(0, 4);
  const more = plan.exercises.length - shown.length;
  return (
    <Card style={s.hero}>
      <Txt v="label" style={{ color: colors.accent }}>Próximo treino</Txt>
      <View style={s.heroHead}>
        <Letter name={plan.name} />
        <View style={{ flex: 1 }}>
          <Txt v="title" numberOfLines={2}>{plan.title || `Ficha ${plan.name}`}</Txt>
          <Txt v="sub">{plan.exercises.length} exercícios · {plannedSets(plan)} séries</Txt>
        </View>
      </View>
      {shown.length > 0 && (
        <View style={s.preview}>
          {shown.map((e) => (
            <View key={e.id} style={s.previewRow}>
              <ExerciseImage catalogKey={e.catalogKey} name={e.name} size={28} />
              <Txt style={s.previewName} numberOfLines={1}>{e.name}</Txt>
              <Txt v="sub">{e.sets}×{e.reps}</Txt>
            </View>
          ))}
          {more > 0 && <Txt v="sub">+ {more} {more === 1 ? 'exercício' : 'exercícios'}</Txt>}
        </View>
      )}
      <Button label="Começar treino" icon="play" onPress={onStart} disabled={!plan.exercises.length} />
    </Card>
  );
}

export default function Home() {
  const { plans, history, active, start } = useStore();
  const { top } = useSafeAreaInsets();
  const next = nextPlan(plans, history);
  const last = history[0];
  const change = last ? volumeChange(history, last) : undefined;
  const others = next && !active ? plans.filter((p) => p.id !== next.id) : [];
  const now = new Date();

  const begin = (plan: Plan) => {
    start(plan.id);
    router.push('/treino');
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={[s.content, { paddingTop: top + 16 }]}>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <Txt v="label">{now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Txt>
          <Txt v="hero">{greeting(now.getHours())}</Txt>
        </View>
        <IconButton icon="database" label="Backup dos dados" onPress={() => router.push('/backup')} filled />
      </View>

      <WeekStrip history={history} />

      {active ? (
        <ActiveCard session={active} />
      ) : next ? (
        <NextCard plan={next} onStart={() => begin(next)} />
      ) : (
        <Card style={s.hero}>
          <Txt v="title">Monte sua primeira ficha</Txt>
          <Txt v="sub">Escolha os exercícios, as séries e as cargas. Depois é só começar.</Txt>
          <Button label="Criar ficha" icon="plus" onPress={() => router.push('/ficha/nova')} />
        </Card>
      )}

      {others.length > 0 && (
        <View style={s.section}>
          <Txt v="label">Ou fazer outra</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.others}>
            {others.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => begin(p)}
                disabled={!p.exercises.length}
                accessibilityRole="button"
                accessibilityLabel={`Começar ficha ${p.name}, ${p.title}`}
                style={({ pressed }) => [s.other, pressed && s.pressed]}
              >
                <Letter name={p.name} size={40} />
                <Txt v="h2" numberOfLines={2} style={s.otherTitle}>{p.title || `Ficha ${p.name}`}</Txt>
                <View style={s.otherFoot}>
                  <Txt v="sub">{p.exercises.length} exercícios</Txt>
                  <Icon name="play" size={16} color={colors.accent} fill={colors.accent} />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {last && (
        <Pressable
          onPress={() => router.push('/historico')}
          accessibilityRole="button"
          accessibilityLabel="Ver histórico"
          style={({ pressed }) => pressed && s.pressed}
        >
          <Card style={s.last}>
            <View style={s.lastIcon}>
              <Icon name="history" size={20} color={colors.sub} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt v="label">Último treino</Txt>
              <Txt v="h2">Ficha {last.planName} · {daysAgo(last.startedAt)}</Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt v="num">{formatKg(sessionVolume(last))} kg</Txt>
              {change !== undefined && (
                <View style={s.trend}>
                  <Icon name={change >= 0 ? 'trendUp' : 'trendDown'} size={14} color={change >= 0 ? colors.up : colors.danger} />
                  <Txt style={[s.trendText, { color: change >= 0 ? colors.up : colors.danger }]}>{Math.abs(change)}%</Txt>
                </View>
              )}
            </View>
          </Card>
        </Pressable>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  top: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 4 },
  pressed: { opacity: 0.7 },
  hero: { gap: 16, padding: 20, borderWidth: 1, borderColor: colors.line },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  heroHead: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  letter: { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  letterText: { fontFamily: fonts.displayHeavy, color: colors.onAccent },
  preview: { gap: 10, paddingVertical: 4 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewName: { flex: 1, fontFamily: fonts.medium },
  section: { gap: 10 },
  others: { gap: 10, paddingRight: 16 },
  other: { width: 156, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 10 },
  otherTitle: { minHeight: 48 },
  otherFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  last: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  lastIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontFamily: fonts.semibold, fontSize: 13 },
});
