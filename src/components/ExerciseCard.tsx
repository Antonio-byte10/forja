import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExerciseLog, SetLog } from '@/lib/types';
import { exerciseVolume, formatKg, summarizeSets } from '@/lib/workout';
import { colors } from '@/theme';
import { Button, Card, ExerciseImage, NumberInput } from './ui';

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
    <Card style={[s.card, current && s.current, allDone && !open && s.finished]}>
      <View style={s.header}>
        <Pressable
          onPress={() => setPhoto((p) => !p)}
          accessibilityRole="button"
          accessibilityLabel={`${photo ? 'Esconder' : 'Ver'} foto de ${name}`}
          style={({ pressed }) => pressed && s.pressed}
        >
          <ExerciseImage catalogKey={catalogKey} name={name} size={52} />
        </Pressable>
        <Pressable
          onPress={() => setManual(!open)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${name}, ${doneCount} de ${sets.length} séries feitas`}
          style={({ pressed }) => [s.title, pressed && s.pressed]}
        >
          <View style={s.titleText}>
            <Text style={s.name}>{name}</Text>
            <Text style={s.muted} numberOfLines={1}>
              {allDone && !open ? `${formatKg(volume)} kg de volume` : unilateral ? 'Carga por lado' : `${sets.length} séries`}
            </Text>
          </View>
          <View style={[s.progress, allDone && s.progressDone]}>
            <Text style={[s.progressText, allDone && { color: colors.onAccent }]}>{allDone ? '✓' : `${doneCount}/${sets.length}`}</Text>
          </View>
        </Pressable>
      </View>

      {open && (
        <>
          {photo && <ExerciseImage catalogKey={catalogKey} name={name} size="100%" />}
          <Text style={s.muted}>
            {last ? `Última vez: ${summarizeSets(last)}${unilateral ? ' (por lado)' : ''}` : 'Primeira vez com esse exercício'}
            {volume > 0 && `  ·  ${formatKg(volume)} kg`}
          </Text>

          <View style={s.row}>
            <Text style={[s.col, s.num]}>#</Text>
            <Text style={[s.col, s.flex]}>{unilateral ? 'kg cada lado' : 'kg'}</Text>
            <Text style={[s.col, s.flex]}>reps</Text>
            <Text style={[s.col, s.check]}>feito</Text>
          </View>
          {sets.map((set, i) => (
            <View key={i} style={s.row}>
              <Text style={[s.setNum, s.num]}>{i + 1}</Text>
              <View style={[s.flex, set.done && s.dim]}>
                <NumberInput label={`${name}: carga série ${i + 1}`} value={set.weight} onChange={(weight) => onChange(i, { weight })} />
              </View>
              <View style={[s.flex, set.done && s.dim]}>
                <NumberInput integer label={`${name}: repetições série ${i + 1}`} value={set.reps} onChange={(reps) => onChange(i, { reps })} />
              </View>
              <Pressable
                onPress={() => onToggle(i, !set.done)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: set.done }}
                accessibilityLabel={`${name}: série ${i + 1} feita`}
                style={[s.checkBtn, set.done && s.checkOn]}
              >
                <Text style={[s.checkMark, set.done && { color: colors.onAccent }]}>✓</Text>
              </Pressable>
            </View>
          ))}

          <View style={s.footer}>
            <View style={s.flex}>
              <Button small variant="ghost" label="− Série" onPress={onRemoveSet} disabled={sets.length <= 1} />
            </View>
            <View style={s.flex}>
              <Button small variant="ghost" label="+ Série" onPress={onAddSet} />
            </View>
          </View>
        </>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  card: { gap: 10 },
  current: { borderColor: colors.accent },
  finished: { opacity: 0.75 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 },
  titleText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.6 },
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  progress: {
    minWidth: 44, height: 32, borderRadius: 16, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.raised,
  },
  progressDone: { backgroundColor: colors.accent },
  progressText: { color: colors.text, fontWeight: '800', fontSize: 13, fontVariant: ['tabular-nums'] },
  muted: { color: colors.muted, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  dim: { opacity: 0.5 },
  col: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  num: { width: 22 },
  flex: { flex: 1 },
  check: { width: 48 },
  setNum: { color: colors.muted, fontWeight: '700', textAlign: 'center' },
  checkBtn: {
    width: 48, height: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkMark: { color: colors.muted, fontSize: 20, fontWeight: '900' },
  footer: { flexDirection: 'row', gap: 8, paddingTop: 4 },
});
