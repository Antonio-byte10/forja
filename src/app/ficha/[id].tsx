import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExercisePicker } from '@/components/ExercisePicker';
import { Button, Card, ExerciseImage, IconButton, NumberInput, ScreenHeader, Stepper, Txt } from '@/components/ui';
import { confirm } from '@/lib/platform';
import type { Lugar, Medida, Plan, PlanExercise } from '@/lib/types';
import { medidaDe, porTempo, uid } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, fonts, radius } from '@/theme';

/** Primeira letra ainda não usada por outra ficha. */
const freeLetter = (plans: Plan[]) =>
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((l) => !plans.some((p) => p.name === l)) ?? '?';

const MEDIDAS: [Medida, string][] = [['carga', 'Carga'], ['reps', 'Só reps'], ['tempo', 'Tempo'], ['cardio', 'Cardio'], ['alongamento', 'Alongar']];
const LUGARES: [Lugar, string][] = [['academia', 'Academia'], ['casa', 'Casa']];
const DESCANSOS: [string, string][] = [['60', '60 s'], ['90', '90 s'], ['120', '2 min'], ['180', '3 min']];
/** As opções fixas, mais o valor atual se vier de outro lugar (ex.: backup com 150 s). */
const descansos = (atual: number): [string, string][] =>
  DESCANSOS.some(([v]) => Number(v) === atual) ? DESCANSOS : [...DESCANSOS, [String(atual), `${atual} s`]];
/** Topo da faixa de repetições: "Fixo" ou até +2, +4, +6 acima do mínimo. */
const faixas = (reps: number): [string, string][] => [['0', 'Fixo'], ...[2, 4, 6].map((d): [string, string] => [String(reps + d), `${reps}–${reps + d}`])];

function Opcoes<T extends string>({ options, value, onChange, label }: { options: [T, string][]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <View style={s.opcoes} accessibilityLabel={label}>
      {options.map(([v, texto]) => (
        <Pressable
          key={v}
          onPress={() => onChange(v)}
          accessibilityRole="button"
          accessibilityState={{ selected: v === value }}
          style={({ pressed }) => [s.opcao, v === value && s.opcaoOn, pressed && { opacity: 0.7 }]}
        >
          <Txt style={[s.opcaoTexto, v === value && { color: colors.onAccent }]}>{texto}</Txt>
        </Pressable>
      ))}
    </View>
  );
}

export default function EditarFicha() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plans = useStore((st) => st.plans);
  const { savePlan, deletePlan } = useStore.getState();
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

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  /** Ficha pronta para salvar: anotação vazia some e a faixa de reps só fica se for acima do mínimo. */
  const limpa = (p: Plan): Plan => ({
    ...p,
    name: p.name.trim() || '?',
    title: p.title.trim(),
    exercises: p.exercises.map(({ note, repsMax, ...e }) => ({
      ...e,
      ...(note?.trim() ? { note: note.trim() } : {}),
      ...(repsMax && repsMax > e.reps ? { repsMax } : {}),
    })),
  });

  const save = () => {
    savePlan(limpa(plan));
    back();
  };

  // Salva a ficha atual (com o que foi mudado) e cria a cópia.
  const duplicate = () => {
    const atual = limpa(plan);
    savePlan(atual);
    savePlan({
      ...atual,
      id: uid(),
      name: freeLetter([...plans.filter((p) => p.id !== atual.id), atual]),
      title: atual.title ? `${atual.title} (cópia)` : `Cópia ${atual.name}`,
      exercises: atual.exercises.map((e) => ({ ...e, id: uid() })),
    });
    back();
  };

  const remove = async () => {
    if (!(await confirm(`Apagar a ficha ${plan.name}?`, 'O histórico dos treinos continua salvo.', 'Apagar'))) return;
    deletePlan(plan.id);
    back();
  };

  return (
    <View style={s.screen}>
      <ScreenHeader
        kicker={saved ? 'Editar ficha' : 'Nova ficha'}
        title={plan.title || `Ficha ${plan.name}`}
        right={<Button small label="Salvar" onPress={save} />}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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

        <View style={s.field}>
          <Txt v="label">Onde</Txt>
          <Opcoes label="Onde" options={LUGARES} value={plan.lugar ?? 'academia'} onChange={(lugar) => setPlan((p) => ({ ...p, lugar }))} />
          <Txt v="sub">Fichas de casa não entram na sequência A → B → C da academia.</Txt>
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
            <Opcoes
              label={`${ex.name}: como medir`}
              options={MEDIDAS}
              value={medidaDe(ex)}
              onChange={(medida) => patch(i, { medida, ...(porTempo(medida) && !ex.seconds && { seconds: medida === 'cardio' ? 1200 : 30 }), ...(!porTempo(medida) && !ex.reps && { reps: 10 }) })}
            />
            <View style={s.controls}>
              <View style={{ flex: 1 }}>
                <Stepper label="Séries" value={ex.sets} onChange={(sets) => patch(i, { sets })} />
              </View>
              {porTempo(medidaDe(ex)) ? (
                <View style={[s.field, { flex: 1 }]}>
                  <Txt v="label">{medidaDe(ex) === 'cardio' ? 'Minutos' : 'Segundos'}</Txt>
                  {medidaDe(ex) === 'cardio' ? (
                    <NumberInput label={`${ex.name}: minutos`} value={Math.round((ex.seconds ?? 0) / 6) / 10} onChange={(min) => patch(i, { seconds: Math.round(min * 60) })} style={s.tempo} />
                  ) : (
                    <NumberInput integer label={`${ex.name}: segundos`} value={ex.seconds ?? 0} onChange={(seconds) => patch(i, { seconds })} style={s.tempo} />
                  )}
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <Stepper
                    label={ex.repsMax && ex.repsMax > ex.reps ? 'Reps mín.' : 'Reps'}
                    value={ex.reps}
                    onChange={(reps) => patch(i, { reps, ...(ex.repsMax && ex.repsMax > ex.reps && { repsMax: ex.repsMax + (reps - ex.reps) }) })}
                  />
                </View>
              )}
            </View>
            {medidaDe(ex) === 'carga' && (
              <View style={s.field}>
                <Txt v="label">Faixa de repetições</Txt>
                <Opcoes
                  label={`${ex.name}: faixa de repetições`}
                  options={faixas(ex.reps)}
                  value={String(ex.repsMax && ex.repsMax > ex.reps ? ex.repsMax : 0)}
                  onChange={(v) => patch(i, { repsMax: Number(v) || undefined })}
                />
                <Txt v="sub" style={{ fontSize: 12 }}>
                  Quando você fizer {ex.repsMax && ex.repsMax > ex.reps ? ex.repsMax : ex.reps} reps em todas as séries, o app sugere
                  +{ex.unilateral ? '1 kg/lado' : '2,5 kg'} no próximo treino.
                </Txt>
              </View>
            )}
            {medidaDe(ex) === 'carga' && (
              <>
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
              </>
            )}
            {medidaDe(ex) !== 'alongamento' && medidaDe(ex) !== 'cardio' && (
              <View style={s.field}>
                <Txt v="label">Descanso entre séries</Txt>
                <Opcoes
                  label={`${ex.name}: descanso entre séries`}
                  options={descansos(ex.restSeconds ?? 90)}
                  value={String(ex.restSeconds ?? 90)}
                  onChange={(v) => patch(i, { restSeconds: Number(v) })}
                />
              </View>
            )}
            <TextInput
              value={ex.note ?? ''}
              onChangeText={(note) => patch(i, { note })}
              placeholder="Anotação (ex.: aparelho 3, banco 4)"
              placeholderTextColor={colors.faint}
              style={s.noteInput}
              accessibilityLabel={`${ex.name}: anotação`}
            />
          </Card>
        ))}

        <Button variant="ghost" icon="plus" label="Adicionar exercício" onPress={() => setPicking(true)} />
        <Button icon="check" label="Salvar ficha" onPress={save} />
        {saved && <Button variant="secondary" icon="copy" label="Duplicar ficha" onPress={duplicate} />}
        {saved && <Button variant="danger" icon="trash" label="Apagar ficha" onPress={remove} />}
      </ScrollView>
      </KeyboardAvoidingView>
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
  tempo: { height: 44 },
  noteInput: {
    backgroundColor: colors.raised, color: colors.text, borderRadius: radius.sm, height: 42, paddingHorizontal: 12,
    fontFamily: fonts.body, fontSize: 14,
  },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  opcao: { height: 34, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.raised, justifyContent: 'center' },
  opcaoOn: { backgroundColor: colors.accent },
  opcaoTexto: { fontFamily: fonts.semibold, fontSize: 13 },
});
