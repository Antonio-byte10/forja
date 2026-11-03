import { Redirect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseCard } from '@/components/ExerciseCard';
import { RestTimer, type Rest } from '@/components/RestTimer';
import { Button, ProgressBar, ScreenHeader, Txt } from '@/components/ui';
import { confirm, useNow } from '@/lib/platform';
import type { Session } from '@/lib/types';
import { countSets, exerciseKey, formatClock, formatKg, lastSets, sessionVolume } from '@/lib/workout';
import { useStore } from '@/store';
import { colors } from '@/theme';

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
    <View style={s.stats}>
      <View style={s.statRow}>
        {items.map(([label, value]) => (
          <View key={label} style={s.stat}>
            <Txt v="label">{label}</Txt>
            <Txt v="num">{value}</Txt>
          </View>
        ))}
      </View>
      <ProgressBar value={total ? done / total : 0} />
    </View>
  );
}

export default function Treino() {
  const { active, history, updateSet, addSet, removeSet, finish, discard } = useStore();
  const [rest, setRest] = useState<Rest>();
  const onRest = useCallback((r?: Rest) => setRest(r), []);
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
      <ScreenHeader
        kicker={`Ficha ${active.planName}`}
        title={active.planTitle || 'Treino'}
        right={<Button small label="Finalizar" onPress={onFinish} />}
      />
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: bottom + (rest ? 150 : 32) }]}
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
              setRest(done ? { end: Date.now() + REST_MS, total: REST_MS } : undefined);
            }}
            onAddSet={() => addSet(i)}
            onRemoveSet={() => removeSet(i)}
          />
        ))}
        {current === -1 && <Button label="Finalizar treino" icon="check" onPress={onFinish} />}
        <Button variant="danger" icon="trash" label="Descartar treino" onPress={onDiscard} />
      </ScrollView>
      <RestTimer rest={rest} onChange={onRest} bottom={bottom + 12} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, gap: 12 },
  // Fixo no topo enquanto rola; o fundo evita que os cartões apareçam por trás.
  stats: { backgroundColor: colors.bg, paddingBottom: 12, paddingTop: 4, gap: 12 },
  statRow: { flexDirection: 'row' },
  stat: { flex: 1, gap: 2 },
});
