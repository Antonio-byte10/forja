import { Redirect, router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseCard } from '@/components/ExerciseCard';
import { RestTimer } from '@/components/RestTimer';
import { Button } from '@/components/ui';
import { confirm, useNow } from '@/lib/platform';
import type { Session } from '@/lib/types';
import { countSets, exerciseKey, formatClock, formatKg, lastSets, sessionVolume } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, radius } from '@/theme';

const REST_MS = 90_000;

function Stats({ session }: { session: Session }) {
  const now = useNow();
  const { done, total } = countSets(session);
  const items = [
    ['Tempo', formatClock(now - session.startedAt)],
    ['Volume', `${formatKg(sessionVolume(session))} kg`],
    ['Séries', `${done}/${total}`],
  ];
  return (
    <View style={s.statsWrap}>
      <View style={s.stats}>
        {items.map(([label, value]) => (
          <View key={label} style={s.stat}>
            <Text style={s.statValue}>{value}</Text>
            <Text style={s.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function Treino() {
  const { active, history, updateSet, addSet, removeSet, finish, discard } = useStore();
  const [restEnd, setRestEnd] = useState<number>();
  const onRest = useCallback((end?: number) => setRestEnd(end), []);
  const { bottom } = useSafeAreaInsets();

  if (!active) return <Redirect href="/" />;

  const current = active.exercises.findIndex((e) => e.sets.some((x) => !x.done));

  const onFinish = async () => {
    const { done } = countSets(active);
    const ok = await confirm(
      'Finalizar treino?',
      done ? `${done} séries · ${formatKg(sessionVolume(active))} kg de volume` : 'Nenhuma série marcada como feita: o treino não será salvo.',
      'Finalizar',
    );
    if (!ok) return;
    router.replace('/');
    if (done) finish();
    else discard();
  };

  const onDiscard = async () => {
    if (!(await confirm('Descartar treino?', 'Nada deste treino será salvo.', 'Descartar'))) return;
    router.replace('/');
    discard();
  };

  return (
    <View style={s.screen}>
      <Stack.Screen options={{ title: `Ficha ${active.planName} · ${active.planTitle}` }} />
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={[0]}
      >
        <Stats session={active} />
        {active.exercises.map((ex, i) => (
          <ExerciseCard
            key={i}
            exercise={ex}
            last={lastSets(history, exerciseKey(ex))}
            current={i === current}
            onChange={(set, patch) => updateSet(i, set, patch)}
            onToggle={(set, done) => {
              updateSet(i, set, { done });
              setRestEnd(done ? Date.now() + REST_MS : undefined);
            }}
            onAddSet={() => addSet(i)}
            onRemoveSet={() => removeSet(i)}
          />
        ))}
        <Button label="Finalizar treino" onPress={onFinish} />
        <Button variant="danger" label="Descartar treino" onPress={onDiscard} />
      </ScrollView>
      <RestTimer endAt={restEnd} onChange={onRest} bottom={bottom + 12} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 14 },
  // Fixo no topo enquanto rola; o fundo evita que os cartões apareçam por trás.
  statsWrap: { backgroundColor: colors.bg, paddingBottom: 4 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
