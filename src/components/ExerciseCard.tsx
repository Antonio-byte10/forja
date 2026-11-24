import { memo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { ExerciseLog, SetLog } from '@/lib/types';
import { exerciseVolume, formatKg, formatKm, formatSeconds, formatSet, medidaDe, platesPerSide, restoPorLado, usaBarra } from '@/lib/workout';
import { colors, fonts, radius } from '@/theme';
import { Icon } from './Icon';
import { Button, Card, ExerciseImage, IconButton, NumberInput, Txt } from './ui';

type Props = {
  /** Posição do exercício no treino; volta em todos os avisos para o cartão não precisar de funções novas a cada toque. */
  index: number;
  exercise: ExerciseLog;
  last?: SetLog[];
  /** Maior carga já feita nesse exercício no histórico. */
  bestWeight?: number;
  /** Próximo exercício a fazer: ganha destaque. */
  current?: boolean;
  onChange: (ex: number, set: number, patch: Partial<SetLog>) => void;
  onNote?: (ex: number, note: string) => void;
  onToggle: (ex: number, set: number, done: boolean) => void;
  /** Exercícios por tempo: começa a contagem da série. */
  onTimer: (ex: number, set: number) => void;
  onAddSet: (ex: number) => void;
  onRemoveSet: (ex: number) => void;
  onRemove?: (ex: number) => void;
  /** Muda de posição no treino (−1 sobe, +1 desce). */
  onMove?: (ex: number, delta: number) => void;
  /** Trocar por outro exercício (aparelho ocupado). */
  onSwap?: (ex: number) => void;
  /** Para mostrar as setas só onde dá para mover. */
  total?: number;
};

/** O que foi feito no exercício, na unidade em que ele é medido. */
function feito(exercise: ExerciseLog) {
  const medida = medidaDe(exercise);
  const done = exercise.sets.filter((x) => x.done);
  if (medida === 'carga') return `${formatKg(exerciseVolume(exercise))} kg de volume`;
  if (medida === 'reps') return `${done.reduce((n, x) => n + x.reps, 0)} repetições`;
  const sec = done.reduce((n, x) => n + (x.seconds ?? 0), 0);
  const m = done.reduce((n, x) => n + (x.meters ?? 0), 0);
  return medida === 'cardio' ? `${Math.round(sec / 60)} min${m ? ` · ${formatKm(m)} km` : ''}` : formatSeconds(sec);
}

export const ExerciseCard = memo(function ExerciseCard({
  index, exercise, last, bestWeight = 0, current, onChange, onNote, onToggle, onTimer, onAddSet, onRemoveSet, onRemove, onMove, onSwap, total = 0,
}: Props) {
  const { name, catalogKey, unilateral, sets } = exercise;
  const medida = medidaDe(exercise);
  const cronometrado = medida === 'tempo' || medida === 'alongamento';
  const doneCount = sets.filter((x) => x.done).length;
  const allDone = doneCount === sets.length;
  const isRecord = medida === 'carga' && bestWeight > 0 && sets.some((x) => x.done && x.weight > bestWeight);
  const maxWeight = usaBarra(exercise) ? Math.max(0, ...sets.map((x) => x.weight)) : 0;
  const plates = maxWeight > 20 ? platesPerSide(maxWeight) : [];
  const resto = plates.length ? restoPorLado(maxWeight) : 0;
  const nada = doneCount === 0;

  // Fecha sozinho quando todas as séries estão feitas; um toque abre ou fecha de novo.
  const [manual, setManual] = useState<boolean>();
  const [photo, setPhoto] = useState(false);
  const open = manual ?? !allDone;
  const detalhe = medida === 'carga' ? (unilateral ? ' · carga por lado' : '') : medida === 'reps' ? ' · peso do corpo' : medida === 'cardio' ? ' · cardio' : ' · por tempo';

  return (
    <Card style={[s.card, current && s.current]}>
      <View style={s.header}>
        <Pressable
          onPress={() => setPhoto((p) => !p)}
          accessibilityRole="button"
          accessibilityLabel={`${photo ? 'Esconder' : 'Ver'} o movimento de ${name}`}
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
            <View style={s.nameRow}>
              <Txt v="h2" numberOfLines={2} style={[{ flexShrink: 1 }, allDone && !open && { color: colors.sub }]}>{name}</Txt>
              {isRecord && (
                <View style={s.prBadge}>
                  <Txt style={s.prText}>RECORDE</Txt>
                </View>
              )}
            </View>
            <Txt v="sub" numberOfLines={1}>
              {allDone ? feito(exercise) : `${sets.length} ${sets.length === 1 ? 'série' : 'séries'}${detalhe}`}
              {!open && exercise.note?.trim() ? ` · ${exercise.note.trim()}` : ''}
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
          {photo && <ExerciseImage catalogKey={catalogKey} name={name} size="100%" animado />}
          {exercise.progressao && nada ? (
            <View style={s.tip}>
              <Icon name="trendUp" size={16} color={colors.up} />
              <Txt v="sub" style={{ flex: 1, color: colors.text }}>
                +{formatKg(exercise.progressao)} kg{unilateral ? '/lado' : ''}: da última vez você bateu todas as repetições.
              </Txt>
            </View>
          ) : null}

          <View style={s.row}>
            <Txt v="label" style={[s.colSet, s.colHead]} numberOfLines={1}>Série</Txt>
            <Txt v="label" style={[s.colPrev, s.colHead]} numberOfLines={1}>Última</Txt>
            {medida === 'carga' && <Txt v="label" style={[s.colInput, s.colHead]} numberOfLines={1}>{unilateral ? 'kg/lado' : 'kg'}</Txt>}
            {(medida === 'carga' || medida === 'reps') && <Txt v="label" style={[s.colInput, s.colHead]} numberOfLines={1}>Reps</Txt>}
            {cronometrado && <Txt v="label" style={[s.colInput, s.colHead]} numberOfLines={1}>Segundos</Txt>}
            {medida === 'cardio' && <Txt v="label" style={[s.colInput, s.colHead]} numberOfLines={1}>Min</Txt>}
            {medida === 'cardio' && <Txt v="label" style={[s.colInput, s.colHead]} numberOfLines={1}>Km</Txt>}
            <View style={s.colCheck} />
          </View>

          {sets.map((set, i) => {
            const prev = last?.[i];
            const input = set.done && s.inputDone;
            // Série por tempo ainda não feita: o botão começa a contagem em vez de só marcar.
            const contar = cronometrado && !set.done;
            return (
              <View key={i} style={[s.row, s.setRow, set.done && s.setDone]}>
                <Txt style={[s.colSet, s.setNum, set.done && { color: colors.accent }]}>{i + 1}</Txt>
                <Txt v="sub" style={s.colPrev} numberOfLines={1}>
                  {!prev ? '—' : medida === 'cardio' ? `${Math.round((prev.seconds ?? 0) / 60)} min` : formatSet(prev, medida)}
                </Txt>
                {medida === 'carga' && (
                  <View style={s.colInput}>
                    <NumberInput label={`${name}: carga da série ${i + 1}`} value={set.weight} onChange={(weight) => onChange(index, i, { weight })} style={input} />
                  </View>
                )}
                {(medida === 'carga' || medida === 'reps') && (
                  <View style={s.colInput}>
                    <NumberInput integer label={`${name}: repetições da série ${i + 1}`} value={set.reps} onChange={(reps) => onChange(index, i, { reps })} style={input} />
                  </View>
                )}
                {cronometrado && (
                  <View style={s.colInput}>
                    <NumberInput integer label={`${name}: segundos da série ${i + 1}`} value={set.seconds ?? 0} onChange={(seconds) => onChange(index, i, { seconds })} style={input} />
                  </View>
                )}
                {medida === 'cardio' && (
                  <>
                    <View style={s.colInput}>
                      <NumberInput label={`${name}: minutos`} value={Math.round(((set.seconds ?? 0) / 60) * 10) / 10} onChange={(min) => onChange(index, i, { seconds: Math.round(min * 60) })} style={input} />
                    </View>
                    <View style={s.colInput}>
                      <NumberInput label={`${name}: quilômetros`} value={(set.meters ?? 0) / 1000} onChange={(km) => onChange(index, i, { meters: Math.round(km * 1000) })} style={input} />
                    </View>
                  </>
                )}
                <Pressable
                  onPress={() => (contar ? onTimer(index, i) : onToggle(index, i, !set.done))}
                  onLongPress={() => onToggle(index, i, !set.done)}
                  accessibilityRole={contar ? 'button' : 'checkbox'}
                  aria-checked={contar ? undefined : set.done}
                  accessibilityState={contar ? undefined : { checked: set.done }}
                  accessibilityLabel={contar ? `${name}: começar a contagem da série ${i + 1}` : `${name}: série ${i + 1} feita`}
                  style={({ pressed }) => [s.colCheck, s.check, set.done && s.checkOn, pressed && s.pressed]}
                >
                  {contar ? (
                    <Icon name="play" size={18} color={colors.accent} fill={colors.accent} />
                  ) : (
                    <Icon name="check" size={22} color={set.done ? colors.onAccent : colors.faint} stroke={3} />
                  )}
                </Pressable>
              </View>
            );
          })}
          {cronometrado && !allDone && <Txt v="sub" style={s.hint}>Toque em ▶ para contar o tempo. Segure para marcar como feita sem contar.</Txt>}
          {plates.length > 0 && (
            <Txt v="sub" style={s.plates}>
              Barra 20 kg + {plates.map((x) => x.toLocaleString('pt-BR')).join(' + ')} kg/lado
              {resto ? ` (faltam ${resto.toLocaleString('pt-BR')} kg/lado em anilhas)` : ''}
            </Txt>
          )}
          {onNote && (
            <TextInput
              value={exercise.note ?? ''}
              onChangeText={(t) => onNote(index, t)}
              placeholder="Anotação (ex.: banco 4, pegada média)"
              placeholderTextColor={colors.faint}
              accessibilityLabel={`${name}: anotação`}
              style={s.noteInput}
            />
          )}

          <View style={s.footer}>
            <IconButton icon="minus" label="Remover a última série" onPress={() => onRemoveSet(index)} disabled={sets.length <= 1} filled />
            <Button small variant="secondary" icon="plus" label="Adicionar série" onPress={() => onAddSet(index)} style={{ flex: 1 }} />
          </View>
          {(onMove || onSwap || onRemove) && (
            <View style={s.tools}>
              {onMove && <IconButton icon="arrowUp" label={`Subir ${name}`} onPress={() => onMove(index, -1)} disabled={index === 0} size={40} />}
              {onMove && <IconButton icon="arrowDown" label={`Descer ${name}`} onPress={() => onMove(index, 1)} disabled={index >= total - 1} size={40} />}
              <View style={{ flex: 1 }} />
              {onSwap && <Button small variant="ghost" icon="swap" label="Trocar" onPress={() => onSwap(index)} />}
              {onRemove && <IconButton icon="trash" label={`Tirar ${name} do treino`} color={colors.danger} onPress={() => onRemove(index)} size={40} />}
            </View>
          )}
        </View>
      )}
    </Card>
  );
});

const s = StyleSheet.create({
  card: { padding: 0, borderWidth: 1.5, borderColor: 'transparent', overflow: 'hidden' },
  current: { borderColor: colors.accent },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  title: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  prBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.16)', borderWidth: 1, borderColor: colors.up,
    borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2,
  },
  prText: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.6, color: colors.up },
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
  hint: { fontSize: 12, marginTop: 2 },
  plates: { fontSize: 12, marginTop: 4, color: colors.sub },
  noteInput: {
    backgroundColor: colors.raised, color: colors.text, borderRadius: radius.sm, minHeight: 42,
    paddingHorizontal: 12, paddingVertical: 8, fontFamily: fonts.body, fontSize: 13, marginTop: 4,
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 4, borderTopWidth: 1, borderColor: colors.line, paddingTop: 8, marginTop: 4 },
  tip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: radius.sm,
    backgroundColor: 'rgba(74, 222, 128, 0.10)', borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.35)',
  },
});
