import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { ExercisePicker } from '@/components/ExercisePicker';
import { Button, Card, ExerciseImage, NumberInput, Stepper } from '@/components/ui';
import { confirm } from '@/lib/platform';
import type { Plan, PlanExercise } from '@/lib/types';
import { uid } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, radius } from '@/theme';

/** Primeira letra ainda não usada por outra ficha. */
const freeLetter = (plans: Plan[]) =>
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((l) => !plans.some((p) => p.name === l)) ?? '?';

export default function EditarFicha() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plans, savePlan, deletePlan } = useStore();
  const saved = plans.find((p) => p.id === id);
  const [plan, setPlan] = useState<Plan>(
    () => saved ?? { id: uid(), name: freeLetter(plans), title: '', exercises: [] },
  );
  const [picking, setPicking] = useState(false);

  const setExercises = (fn: (list: PlanExercise[]) => PlanExercise[]) =>
    setPlan((p) => ({ ...p, exercises: fn(p.exercises) }));
  const patch = (i: number, change: Partial<PlanExercise>) =>
    setExercises((list) => list.map((e, j) => (j === i ? { ...e, ...change } : e)));
  const move = (i: number, to: number) =>
    setExercises((list) => {
      const next = [...list];
      [next[i], next[to]] = [next[to], next[i]];
      return next;
    });

  const save = () => {
    savePlan({ ...plan, name: plan.name.trim() || '?', title: plan.title.trim() });
    router.back();
  };

  const remove = async () => {
    if (!(await confirm(`Apagar a ficha ${plan.name}?`, 'O histórico dos treinos continua salvo.', 'Apagar'))) return;
    deletePlan(plan.id);
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: saved ? `Ficha ${saved.name}` : 'Nova ficha',
          headerRight: () => (
            <Pressable onPress={save} accessibilityRole="button" style={({ pressed }) => [s.headerSave, pressed && s.off]}>
              <Text style={s.headerSaveText}>Salvar</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.names}>
          <TextInput
            value={plan.name}
            onChangeText={(name) => setPlan((p) => ({ ...p, name: name.toUpperCase() }))}
            maxLength={2}
            style={[s.input, s.letter]}
            accessibilityLabel="Letra da ficha"
          />
          <TextInput
            value={plan.title}
            onChangeText={(title) => setPlan((p) => ({ ...p, title }))}
            placeholder="Ex.: Peito e tríceps"
            placeholderTextColor={colors.muted}
            style={[s.input, { flex: 1 }]}
            accessibilityLabel="Nome da ficha"
          />
        </View>

        {plan.exercises.map((ex, i) => (
          <Card key={ex.id} style={s.card}>
            <View style={s.row}>
              <ExerciseImage catalogKey={ex.catalogKey} name={ex.name} size={40} />
              <Text style={s.name}>{ex.name}</Text>
              <Pressable onPress={() => move(i, i - 1)} disabled={i === 0} style={s.icon} accessibilityRole="button" accessibilityLabel={`Subir ${ex.name}`}>
                <Text style={[s.iconText, i === 0 && s.off]}>↑</Text>
              </Pressable>
              <Pressable onPress={() => move(i, i + 1)} disabled={i === plan.exercises.length - 1} style={s.icon} accessibilityRole="button" accessibilityLabel={`Descer ${ex.name}`}>
                <Text style={[s.iconText, i === plan.exercises.length - 1 && s.off]}>↓</Text>
              </Pressable>
              <Pressable onPress={() => setExercises((list) => list.filter((e) => e.id !== ex.id))} style={s.icon} accessibilityRole="button" accessibilityLabel={`Remover ${ex.name} da ficha`}>
                <Text style={[s.iconText, { color: colors.danger }]}>✕</Text>
              </Pressable>
            </View>
            <View style={s.row}>
              <Stepper label="Séries" value={ex.sets} onChange={(sets) => patch(i, { sets })} />
              <Stepper label="Reps" value={ex.reps} onChange={(reps) => patch(i, { reps })} />
            </View>
            <View style={s.row}>
              <Text style={s.label}>{ex.unilateral ? 'Carga inicial (kg cada lado)' : 'Carga inicial (kg)'}</Text>
              <View style={{ width: 90 }}>
                <NumberInput label={`${ex.name}: carga inicial`} value={ex.weight} onChange={(weight) => patch(i, { weight })} />
              </View>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Unilateral (carga por lado)</Text>
              <Switch
                value={ex.unilateral}
                onValueChange={(unilateral) => patch(i, { unilateral })}
                trackColor={{ true: colors.accent, false: colors.border }}
                thumbColor={colors.text}
              />
            </View>
          </Card>
        ))}

        <Button variant="ghost" label="+ Adicionar exercício" onPress={() => setPicking(true)} />
        <Button label="Salvar ficha" onPress={save} />
        {saved && <Button variant="danger" label="Apagar ficha" onPress={remove} />}
      </ScrollView>
      <ExercisePicker visible={picking} onClose={() => setPicking(false)} onPick={(ex) => setExercises((list) => [...list, ex])} />
    </>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  names: { flexDirection: 'row', gap: 8 },
  input: { backgroundColor: colors.card, color: colors.text, borderRadius: radius, padding: 14, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  letter: { width: 64, textAlign: 'center', fontSize: 22, fontWeight: '900', color: colors.accent },
  card: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { color: colors.text, fontWeight: '800', fontSize: 15, flex: 1 },
  icon: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerSave: { paddingHorizontal: 12, height: 44, justifyContent: 'center' },
  headerSaveText: { color: colors.accent, fontWeight: '800', fontSize: 16 },
  iconText: { color: colors.text, fontSize: 18, fontWeight: '800' },
  off: { opacity: 0.25 },
  label: { color: colors.muted, fontSize: 14, flex: 1 },
});
