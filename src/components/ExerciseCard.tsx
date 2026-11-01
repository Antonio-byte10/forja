import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExerciseLog, SetLog } from '@/lib/types';
import { exerciseVolume, formatKg, summarizeSets } from '@/lib/workout';
import { colors } from '@/theme';
import { Card, ExerciseImage, NumberInput } from './ui';

type Props = {
  exercise: ExerciseLog;
  last?: SetLog[];
  onChange: (set: number, patch: Partial<SetLog>) => void;
  onToggle: (set: number, done: boolean) => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
};

export function ExerciseCard({ exercise, last, onChange, onToggle, onAddSet, onRemoveSet }: Props) {
  const { name, catalogKey, unilateral, sets } = exercise;
  const volume = exerciseVolume(exercise);

  return (
    <Card style={s.card}>
      <ExerciseImage catalogKey={catalogKey} name={name} size="100%" />
      <View style={s.header}>
        <Text style={s.name}>{name}</Text>
        {unilateral && <Text style={s.badge}>POR LADO</Text>}
      </View>
      <Text style={s.muted}>
        {last ? `Última vez: ${summarizeSets(last)}` : 'Primeira vez com esse exercício'}
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
            <NumberInput label={`${name}: repetições série ${i + 1}`} value={set.reps} onChange={(reps) => onChange(i, { reps })} />
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
        <Pressable onPress={onRemoveSet} disabled={sets.length <= 1}>
          <Text style={[s.link, sets.length <= 1 && { opacity: 0.3 }]}>− série</Text>
        </Pressable>
        <Pressable onPress={onAddSet}>
          <Text style={s.link}>+ série</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  card: { gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  name: { color: colors.text, fontSize: 19, fontWeight: '800', flexShrink: 1 },
  badge: {
    color: colors.accent, fontSize: 11, fontWeight: '800', borderWidth: 1, borderColor: colors.accent,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, letterSpacing: 0.5, flexShrink: 0,
  },
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
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  link: { color: colors.accent, fontWeight: '700', fontSize: 14, padding: 4 },
});
