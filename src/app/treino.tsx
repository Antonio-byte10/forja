import { Redirect, router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseCard } from '@/components/ExerciseCard';
import { ExercisePicker } from '@/components/ExercisePicker';
import { RestTimer, type Rest } from '@/components/RestTimer';
import { Button, Card, ProgressBar, ScreenHeader, Txt } from '@/components/ui';
import { confirm, useNow } from '@/lib/platform';
import type { Session } from '@/lib/types';
import {
  countSets, exerciseKey, formatClock, formatKg, formatSeconds, lastSets, medidaDe, sessionReps, sessionSeconds, sessionVolume,
} from '@/lib/workout';
import { useActive, useStore } from '@/store';
import { colors } from '@/theme';

const REST_MS = 90_000;

/** O número do meio muda com o tipo de treino: kg na musculação, repetições ou tempo no peso do corpo. */
function destaque(session: Session): [string, string] {
  const kg = sessionVolume(session);
  if (kg > 0) return ['Volume', `${formatKg(kg)} kg`];
  const reps = sessionReps(session);
  if (reps > 0) return ['Repetições', String(reps)];
  const sec = sessionSeconds(session);
  if (sec > 0) return ['Tempo feito', formatSeconds(sec)];
  return ['Volume', '0 kg'];
}

function Stats({ session }: { session: Session }) {
  const now = useNow();
  const { done, total } = countSets(session);
  const items = [['Tempo', formatClock(now - session.startedAt)], destaque(session), ['Séries', `${done}/${total}`]];
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
  const history = useStore((st) => st.history);
  const active = useActive((st) => st.active);
  const { updateSet, addSet, removeSet, addExercise, removeExercise, finish, discard } = useActive.getState();
  const [rest, setRest] = useState<Rest>();
  const [picking, setPicking] = useState(false);
  const { bottom } = useSafeAreaInsets();

  // "Última" de cada exercício: o histórico não muda durante o treino, então calcula uma vez só.
  const chaves = active?.exercises.map(exerciseKey).join('|') ?? '';
  const ultimas = useMemo(() => (chaves ? chaves.split('|').map((k) => lastSets(history, k)) : []), [chaves, history]);

  const onToggle = useCallback((ex: number, set: number, done: boolean) => {
    const medida = medidaDe(useActive.getState().active?.exercises[ex] ?? {});
    useActive.getState().updateSet(ex, set, { done });
    // Alongamento e cardio não pedem descanso depois.
    setRest(done && medida !== 'alongamento' && medida !== 'cardio' ? { end: Date.now() + REST_MS, total: REST_MS } : undefined);
  }, []);

  const onTimer = useCallback((ex: number, set: number) => {
    const exercicio = useActive.getState().active?.exercises[ex];
    const ms = (exercicio?.sets[set]?.seconds ?? 0) * 1000;
    if (exercicio && ms > 0) setRest({ end: Date.now() + ms, total: ms, exec: { ex, set, nome: exercicio.name } });
  }, []);

  // Fim da contagem: se era a própria série, marca como feita (e isso já começa o descanso).
  const onEnd = useCallback((r: Rest) => {
    if (r.exec) onToggle(r.exec.ex, r.exec.set, true);
    else setRest(undefined);
  }, [onToggle]);

  if (!active) return <Redirect href="/" />;

  const current = active.exercises.findIndex((e) => e.sets.some((x) => !x.done));
  const livre = active.tipo === 'livre';

  const onFinish = async () => {
    const { done } = countSets(active);
    const [rotulo, valor] = destaque(active);
    const ok = await confirm(
      'Finalizar treino?',
      done ? `${done} séries · ${rotulo.toLowerCase()}: ${valor}` : 'Nenhuma série marcada como feita: o treino não será salvo.',
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
        kicker={livre ? 'Sem ficha' : `Ficha ${active.planName}`}
        title={active.planTitle || 'Treino'}
        right={<Button small label="Finalizar" onPress={onFinish} />}
      />
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: bottom + (rest ? 150 : 32) }]}
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={[0]}
      >
        <Stats session={active} />
        {active.exercises.length === 0 && (
          <Card style={{ gap: 6 }}>
            <Txt v="h2">Treino livre</Txt>
            <Txt v="sub">Adicione os exercícios conforme for fazendo. No fim, tudo vai para o histórico.</Txt>
          </Card>
        )}
        {active.exercises.map((ex, i) => (
          <ExerciseCard
            key={`${i}-${exerciseKey(ex)}`}
            index={i}
            exercise={ex}
            last={ultimas[i]}
            current={i === current}
            onChange={updateSet}
            onToggle={onToggle}
            onTimer={onTimer}
            onAddSet={addSet}
            onRemoveSet={removeSet}
            onRemove={livre ? removeExercise : undefined}
          />
        ))}
        <Button variant="ghost" icon="plus" label="Adicionar exercício" onPress={() => setPicking(true)} />
        {current === -1 && active.exercises.length > 0 && <Button label="Finalizar treino" icon="check" onPress={onFinish} />}
        <Button variant="danger" icon="trash" label="Descartar treino" onPress={onDiscard} />
      </ScrollView>
      <RestTimer rest={rest} onChange={setRest} onEnd={onEnd} bottom={bottom + 12} />
      <ExercisePicker visible={picking} onClose={() => setPicking(false)} onPick={addExercise} />
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
