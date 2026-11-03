import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExercisePicker } from '@/components/ExercisePicker';
import { Button, Card, ExerciseImage, IconButton, NumberInput, ScreenHeader, Stepper, Txt } from '@/components/ui';
import { confirm } from '@/lib/platform';
import type { Plan, PlanExercise } from '@/lib/types';
import { uid } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, fonts, radius } from '@/theme';

/** Primeira letra ainda não usada por outra ficha. */
const freeLetter = (plans: Plan[]) =>
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((l) => !plans.some((p) => p.name === l)) ?? '?';

export default function EditarFicha() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plans, savePlan, deletePlan } = useStore();
  const { bottom } = useSafeAreaInsets();
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
    <View style={s.screen}>
      <ScreenHeader
        kicker={saved ? 'Editar ficha' : 'Nova ficha'}
        title={plan.title || `Ficha ${plan.name}`}
        right={<Button small label="Salvar" onPress={save} />}
      />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <View style={s.names}>
          <View style={s.field}>
            <Txt v="label">Letra</Txt>
            <TextInput
              value={plan.name}
              onChangeText={(name) => setPlan((p) => ({ ...p, name: name.toUpperCase() }))}
              maxLength={2}
              style={[s.input, s.letter]}
              accessibilityLabel="Letra da ficha"
            />
          </View>
          <View style={[s.field, { flex: 1 }]}>
            <Txt v="label">Nome</Txt>
            <TextInput
              value={plan.title}
              onChangeText={(title) => setPlan((p) => ({ ...p, title }))}
              placeholder="Ex.: Peito e tríceps"
              placeholderTextColor={colors.faint}
              style={s.input}
              accessibilityLabel="Nome da ficha"
            />
          </View>
        </View>

        <Txt v="label" style={{ marginTop: 8 }}>
          {plan.exercises.length ? `Exercícios (${plan.exercises.length})` : 'Exercícios'}
        </Txt>

        {plan.exercises.map((ex, i) => (
          <Card key={ex.id} style={s.card}>
            <View style={s.row}>
              <ExerciseImage catalogKey={ex.catalogKey} name={ex.name} size={40} />
              <Txt v="h2" style={{ flex: 1, fontSize: 16 }} numberOfLines={2}>{ex.name}</Txt>
              <IconButton icon="arrowUp" label={`Subir ${ex.name}`} onPress={() => move(i, i - 1)} disabled={i === 0} size={40} />
              <IconButton
                icon="arrowDown"
                label={`Descer ${ex.name}`}
                onPress={() => move(i, i + 1)}
                disabled={i === plan.exercises.length - 1}
                size={40}
              />
              <IconButton
                icon="trash"
                label={`Remover ${ex.name} da ficha`}
                color={colors.danger}
                onPress={() => setExercises((list) => list.filter((e) => e.id !== ex.id))}
                size={40}
              />
            </View>
            <View style={s.controls}>
              <View style={{ flex: 1 }}>
                <Stepper label="Séries" value={ex.sets} onChange={(sets) => patch(i, { sets })} />
              </View>
              <View style={{ flex: 1 }}>
                <Stepper label="Reps" value={ex.reps} onChange={(reps) => patch(i, { reps })} />
              </View>
            </View>
            <View style={s.weightRow}>
              <View style={{ flex: 1 }}>
                <Txt style={s.switchLabel}>Carga inicial</Txt>
                <Txt v="sub">{ex.unilateral ? 'kg em cada lado' : 'kg'} · depois o app usa a da última vez</Txt>
              </View>
              <NumberInput label={`${ex.name}: carga inicial`} value={ex.weight} onChange={(weight) => patch(i, { weight })} style={s.weight} />
            </View>
            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Txt style={s.switchLabel}>Carga por lado</Txt>
                <Txt v="sub">Halteres e exercícios unilaterais: o volume conta os dois lados.</Txt>
              </View>
              <Switch
                value={ex.unilateral}
                onValueChange={(unilateral) => patch(i, { unilateral })}
                trackColor={{ true: colors.accent, false: colors.line }}
                thumbColor={colors.text}
                // No navegador o Switch usa outra prop para a bolinha ligada.
                {...({ activeThumbColor: colors.text } as object)}
                accessibilityLabel={`${ex.name}: carga por lado`}
              />
            </View>
          </Card>
        ))}

        <Button variant="ghost" icon="plus" label="Adicionar exercício" onPress={() => setPicking(true)} />
        {saved && <Button variant="danger" icon="trash" label="Apagar ficha" onPress={remove} />}
      </ScrollView>
      <ExercisePicker visible={picking} onClose={() => setPicking(false)} onPick={(ex) => setExercises((list) => [...list, ex])} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, gap: 12 },
  names: { flexDirection: 'row', gap: 10 },
  field: { gap: 6 },
  input: {
    backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, height: 52, paddingHorizontal: 14,
    fontFamily: fonts.medium, fontSize: 16, borderWidth: 1, borderColor: colors.line,
  },
  letter: { width: 64, textAlign: 'center', fontFamily: fonts.displayHeavy, fontSize: 26, color: colors.accent },
  card: { gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  controls: { flexDirection: 'row', gap: 10 },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weight: { width: 88, height: 48 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderColor: colors.line, paddingTop: 12 },
  switchLabel: { fontFamily: fonts.semibold, fontSize: 15 },
});
