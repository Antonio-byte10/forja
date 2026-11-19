import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseCard } from '@/components/ExerciseCard';
import { ExercisePicker } from '@/components/ExercisePicker';
import { Button, Card, ScreenHeader, Txt } from '@/components/ui';
import { confirm } from '@/lib/platform';
import type { PlanExercise, Session, SetLog } from '@/lib/types';
import * as w from '@/lib/workout';
import { useStore } from '@/store';
import { colors } from '@/theme';

/** Corrige um treino que já está no histórico: cargas, repetições, séries, exercícios e anotações. */
export default function EditarTreino() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const saved = useStore((st) => st.history.find((s) => s.id === id));
  const { bottom } = useSafeAreaInsets();
  const [session, setSession] = useState<Session | undefined>(saved);
  const [picking, setPicking] = useState(false);

  const edit = useCallback((fn: (s: Session) => Session) => setSession((s) => (s ? fn(s) : s)), []);
  const onChange = useCallback((ex: number, set: number, patch: Partial<SetLog>) => edit((s) => w.updateSet(s, ex, set, patch)), [edit]);
  const onToggle = useCallback((ex: number, set: number, done: boolean) => edit((s) => w.updateSet(s, ex, set, { done })), [edit]);
  const onNote = useCallback((ex: number, note: string) => edit((s) => w.updateNote(s, ex, note)), [edit]);
  const onAddSet = useCallback((ex: number) => edit((s) => w.addSet(s, ex)), [edit]);
  const onRemoveSet = useCallback((ex: number) => edit((s) => w.removeSet(s, ex)), [edit]);
  const onRemove = useCallback((ex: number) => edit((s) => w.removeExercise(s, ex)), [edit]);
  const onMove = useCallback((ex: number, delta: number) => edit((s) => w.moveExercise(s, ex, ex + delta)), [edit]);

  if (!saved || !session) return <Redirect href="/historico" />;

  const salvar = () => {
    useStore.getState().updateSession(session);
    router.back();
  };

  const voltar = async () => {
    if (session === saved || (await confirm('Sair sem salvar?', 'As mudanças neste treino serão perdidas.', 'Sair'))) router.back();
  };

  // Exercício esquecido: entra com as séries já marcadas como feitas.
  const adicionar = (ex: PlanExercise) => {
    const log = w.logFromPlan(ex, []);
    edit((s) => w.addExercise(s, { ...log, sets: log.sets.map((x) => ({ ...x, done: true })) }));
  };

  return (
    <View style={s.screen}>
      <ScreenHeader
        kicker={new Date(session.startedAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        title="Editar treino"
        right={<Button small label="Salvar" onPress={salvar} />}
        onBack={voltar}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={[s.content, { paddingBottom: bottom + 32 }]} keyboardShouldPersistTaps="handled">
          <Card>
            <Txt v="sub">Toque num exercício para abrir. Séries desmarcadas não contam no volume nem nos recordes.</Txt>
          </Card>
          {session.exercises.map((ex, i) => (
            <ExerciseCard
              key={`${i}-${w.exerciseKey(ex)}`}
              index={i}
              exercise={ex}
              total={session.exercises.length}
              onChange={onChange}
              onNote={onNote}
              onToggle={onToggle}
              onTimer={(e, set) => onToggle(e, set, true)}
              onAddSet={onAddSet}
              onRemoveSet={onRemoveSet}
              onRemove={onRemove}
              onMove={onMove}
            />
          ))}
          <Button variant="ghost" icon="plus" label="Adicionar exercício" onPress={() => setPicking(true)} />
          <Button icon="check" label="Salvar mudanças" onPress={salvar} />
        </ScrollView>
      </KeyboardAvoidingView>
      <ExercisePicker visible={picking} onClose={() => setPicking(false)} onPick={adicionar} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, gap: 12 },
});
