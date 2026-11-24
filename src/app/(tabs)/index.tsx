import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { PassosCard } from '@/components/PassosCard';
import { Button, Card, ExerciseImage, IconButton, LetraFicha, ProgressBar, Txt } from '@/components/ui';
import { WeekStrip } from '@/components/WeekStrip';
import { useNow } from '@/lib/platform';
import { fichaConcluida } from '@/lib/semana';
import type { Plan, PlanExercise, Session } from '@/lib/types';
import { countSets, daysAgo, formatClock, medidaDe, nextPlan, porTempo, resumo, seriesPlanejadas, volumeChange } from '@/lib/workout';
import { useActive, useStore } from '@/store';
import { colors, fonts, radius } from '@/theme';
import { dataLocal } from '@/lib/datas';

const greeting = (h: number) => (h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite');
/** "3×12" ou, nos exercícios por tempo, "3×30 s". */
const meta = (e: PlanExercise) => (porTempo(medidaDe(e)) ? `${e.sets}×${e.seconds ?? 0} s` : `${e.sets}×${e.reps}`);

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
        <LetraFicha letra={session.planName} />
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

function NextCard({ plan, agendado, onStart }: { plan: Plan; agendado: boolean; onStart: () => void }) {
  const shown = plan.exercises.slice(0, 4);
  const more = plan.exercises.length - shown.length;
  return (
    <Card style={s.hero}>
      <Txt v="label" style={{ color: colors.accent }}>{agendado ? 'Agendado para hoje' : plan.fimDeSemana ? 'Treino de fim de semana' : 'Próximo treino'}</Txt>
      <View style={s.heroHead}>
        <LetraFicha letra={plan.name} />
        <View style={{ flex: 1 }}>
          <Txt v="title" numberOfLines={2}>{plan.title || `Ficha ${plan.name}`}</Txt>
          <Txt v="sub">{plan.exercises.length} exercícios · {seriesPlanejadas(plan)} séries</Txt>
        </View>
      </View>
      {shown.length > 0 && (
        <View style={s.preview}>
          {shown.map((e) => (
            <View key={e.id} style={s.previewRow}>
              <ExerciseImage catalogKey={e.catalogKey} name={e.name} size={28} />
              <Txt style={s.previewName} numberOfLines={1}>{e.name}</Txt>
              <Txt v="sub">{meta(e)}</Txt>
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
  const plans = useStore((s) => s.plans);
  const history = useStore((s) => s.history);
  const active = useActive((s) => s.active);
  const ultimoBackup = useStore((s) => s.ajustes.ultimoBackup);
  const { start, startFree } = useActive.getState();
  const { top } = useSafeAreaInsets();
  const now = new Date(useNow(60_000));
  const hoje = dataLocal(now);
  const fichaHoje = useStore((s) => s.agenda[hoje]);
  const agendado = fichaConcluida(history, hoje, fichaHoje) ? undefined : plans.find((p) => p.id === fichaHoje && p.exercises.length);
  const next = agendado ?? nextPlan(plans, history, now);
  const last = history[0];
  const change = last ? volumeChange(history, last) : undefined;
  const others = !active ? plans.filter((p) => p.id !== next?.id) : [];

  const begin = (plan: Plan) => {
    start(plan.id);
    router.push('/treino');
  };
  const beginFree = () => {
    startFree();
    router.push('/treino');
  };
  const ultimo = last ? resumo(last) : undefined;
  // Lembrete: nunca fez backup e já tem alguns treinos, ou o último backup tem mais de 30 dias.
  const diasSemBackup = ultimoBackup ? Math.floor((now.getTime() - ultimoBackup) / 86_400_000) : undefined;
  const lembrarBackup = !active && (diasSemBackup === undefined ? history.length >= 5 : diasSemBackup >= 30);

  return (
    <ScrollView style={s.screen} contentContainerStyle={[s.content, { paddingTop: top + 16 }]}>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <Txt v="label">{now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Txt>
          <Txt v="hero">{greeting(now.getHours())}</Txt>
        </View>
        <IconButton icon="calendar" label="Planejar semana" onPress={() => router.push('/planejamento')} filled />
        <IconButton icon="database" label="Backup dos dados" onPress={() => router.push('/backup')} filled />
      </View>

      <WeekStrip history={history} />

      {active ? (
        <ActiveCard session={active} />
      ) : next ? (
        <NextCard plan={next} agendado={!!agendado} onStart={() => begin(next)} />
      ) : !plans.length ? (
        <Card style={s.hero}>
          <Txt v="title">Monte sua primeira ficha</Txt>
          <Txt v="sub">Escolha os exercícios, as séries e as cargas. Depois é só começar.</Txt>
          <Button label="Criar ficha" icon="plus" onPress={() => router.push('/ficha/nova')} />
        </Card>
      ) : null}

      {!active && <PassosCard />}

      {others.length > 0 && (
        <View style={s.section}>
          <Txt v="label">{next ? 'Ou fazer outra' : 'Escolha uma ficha'}</Txt>
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
                <LetraFicha letra={p.name} size={40} />
                <Txt v="h2" numberOfLines={2} style={s.otherTitle}>{p.title || `Ficha ${p.name}`}</Txt>
                <View style={s.otherFoot}>
                  <Txt v="sub">{p.lugar === 'casa' ? 'Em casa' : `${p.exercises.length} exercícios`}</Txt>
                  <Icon name="play" size={16} color={colors.accent} fill={colors.accent} />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {!active && (
        <View style={s.actions}>
          <Button small variant="secondary" icon="plus" label="Treino livre" onPress={beginFree} style={{ flex: 1 }} />
          <Button small variant="secondary" icon="timer" label="Registrar atividade" onPress={() => router.push('/atividade')} style={{ flex: 1.3 }} />
        </View>
      )}

      {lembrarBackup && (
        <Pressable
          onPress={() => router.push('/backup')}
          accessibilityRole="button"
          style={({ pressed }) => pressed && s.pressed}
        >
          <Card style={s.reminder}>
            <Icon name="database" size={20} color={colors.accent} />
            <Txt style={{ flex: 1 }}>
              {diasSemBackup === undefined ? 'Você ainda não fez backup dos treinos.' : `Último backup há ${diasSemBackup} dias.`}{' '}
              <Txt style={{ color: colors.accent }}>Fazer agora</Txt>
            </Txt>
          </Card>
        </Pressable>
      )}

      {last && ultimo && (
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
              <Txt v="h2" numberOfLines={1}>{last.tipo === 'ficha' || !last.tipo ? `Ficha ${last.planName}` : last.planTitle} · {daysAgo(last.startedAt)}</Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt v="num">{ultimo.valor} {ultimo.unidade}</Txt>
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
  top: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  pressed: { opacity: 0.7 },
  hero: { gap: 16, padding: 20, borderWidth: 1, borderColor: colors.line },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  heroHead: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  preview: { gap: 10, paddingVertical: 4 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewName: { flex: 1, fontFamily: fonts.medium },
  section: { gap: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  others: { gap: 10, paddingRight: 16 },
  other: { width: 156, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 10 },
  otherTitle: { minHeight: 48 },
  otherFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  last: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  lastIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontFamily: fonts.semibold, fontSize: 13 },
});
