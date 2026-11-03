import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ExerciseLog, SetLog } from '@/lib/types';
import { exerciseVolume, formatKg } from '@/lib/workout';
import { colors, fonts, radius } from '@/theme';
import { Icon } from './Icon';
import { Button, Card, ExerciseImage, IconButton, NumberInput, Txt } from './ui';

type Props = {
  exercise: ExerciseLog;
  last?: SetLog[];
  /** Próximo exercício a fazer: ganha destaque. */
  current?: boolean;
  onChange: (set: number, patch: Partial<SetLog>) => void;
  onToggle: (set: number, done: boolean) => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
};

export function ExerciseCard({ exercise, last, current, onChange, onToggle, onAddSet, onRemoveSet }: Props) {
  const { name, catalogKey, unilateral, sets } = exercise;
  const doneCount = sets.filter((x) => x.done).length;
  const allDone = doneCount === sets.length;
  const volume = exerciseVolume(exercise);

  // Fecha sozinho quando todas as séries estão feitas; um toque abre ou fecha de novo.
  const [manual, setManual] = useState<boolean>();
  const [photo, setPhoto] = useState(false);
  const open = manual ?? !allDone;

  return (
    <Card style={[s.card, current && s.current]}>
      <View style={s.header}>
        <Pressable
          onPress={() => setPhoto((p) => !p)}
          accessibilityRole="button"
          accessibilityLabel={`${photo ? 'Esconder' : 'Ver'} foto de ${name}`}
          style={({ pressed }) => pressed && s.pressed}
        >
          <ExerciseImage catalogKey={catalogKey} name={name} size={44} />
        </Pressable>
        <Pressable
          onPress={() => setManual(!open)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${name}, ${doneCount} de ${sets.length} séries feitas`}
          style={({ pressed }) => [s.title, pressed && s.pressed]}
        >
          <View style={{ flex: 1 }}>
            <Txt v="h2" numberOfLines={2} style={allDone && !open && { color: colors.sub }}>{name}</Txt>
            <Txt v="sub" numberOfLines={1}>
              {allDone ? `${formatKg(volume)} kg de volume` : `${sets.length} séries${unilateral ? ' · carga por lado' : ''}`}
            </Txt>
          </View>
          {allDone ? (
            <View style={s.doneBadge}>
              <Icon name="check" size={16} color={colors.onAccent} stroke={3} />
            </View>
          ) : (
            <Txt style={[s.count, current && { color: colors.accent }]}>{doneCount}/{sets.length}</Txt>
          )}
          <Icon name={open ? 'chevronUp' : 'chevronDown'} size={18} color={colors.faint} />
        </Pressable>
      </View>

      {open && (
        <View style={s.body}>
          {photo && <ExerciseImage catalogKey={catalogKey} name={name} size="100%" />}

          <View style={s.row}>
            <Txt v="label" style={[s.colSet, s.colHead]} numberOfLines={1}>Série</Txt>
            <Txt v="label" style={[s.colPrev, s.colHead]} numberOfLines={1}>Última</Txt>
            <Txt v="label" style={[s.colInput, s.colHead]} numberOfLines={1}>{unilateral ? 'kg/lado' : 'kg'}</Txt>
            <Txt v="label" style={[s.colInput, s.colHead]} numberOfLines={1}>Reps</Txt>
            <View style={s.colCheck} />
          </View>

          {sets.map((set, i) => {
            const prev = last?.[i];
            return (
              <View key={i} style={[s.row, s.setRow, set.done && s.setDone]}>
                <Txt style={[s.colSet, s.setNum, set.done && { color: colors.accent }]}>{i + 1}</Txt>
                <Txt v="sub" style={s.colPrev} numberOfLines={1}>
                  {prev ? `${formatKg(prev.weight)}×${prev.reps}` : '—'}
                </Txt>
                <View style={s.colInput}>
                  <NumberInput
                    label={`${name}: carga da série ${i + 1}`}
                    value={set.weight}
                    onChange={(weight) => onChange(i, { weight })}
                    style={set.done && s.inputDone}
                  />
                </View>
                <View style={s.colInput}>
                  <NumberInput
                    integer
                    label={`${name}: repetições da série ${i + 1}`}
                    value={set.reps}
                    onChange={(reps) => onChange(i, { reps })}
                    style={set.done && s.inputDone}
                  />
                </View>
                <Pressable
                  onPress={() => onToggle(i, !set.done)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: set.done }}
                  accessibilityLabel={`${name}: série ${i + 1} feita`}
                  style={({ pressed }) => [s.colCheck, s.check, set.done && s.checkOn, pressed && s.pressed]}
                >
                  <Icon name="check" size={22} color={set.done ? colors.onAccent : colors.faint} stroke={3} />
                </Pressable>
              </View>
            );
          })}

          <View style={s.footer}>
            <IconButton icon="minus" label="Remover a última série" onPress={onRemoveSet} disabled={sets.length <= 1} filled />
            <Button small variant="secondary" icon="plus" label="Adicionar série" onPress={onAddSet} style={{ flex: 1 }} />
          </View>
        </View>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  card: { padding: 0, borderWidth: 1.5, borderColor: 'transparent', overflow: 'hidden' },
  current: { borderColor: colors.accent },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  title: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  pressed: { opacity: 0.6 },
  count: { fontFamily: fonts.display, fontSize: 20, color: colors.sub, fontVariant: ['tabular-nums'] },
  doneBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setRow: { borderRadius: radius.md, paddingVertical: 4, marginHorizontal: -6, paddingHorizontal: 6 },
  setDone: { backgroundColor: colors.accentSoft },
  colHead: { fontSize: 11, letterSpacing: 0.4 },
  colSet: { width: 36, textAlign: 'center' },
  colPrev: { width: 58, textAlign: 'center' },
  colInput: { flex: 1, textAlign: 'center' },
  colCheck: { width: 48 },
  setNum: { fontFamily: fonts.display, fontSize: 20, color: colors.sub },
  inputDone: { backgroundColor: 'transparent' },
  check: { height: 46, borderRadius: radius.sm, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.accent },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
});
