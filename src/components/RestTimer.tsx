import { useEffect } from 'react';
import { StyleSheet, Vibration, View } from 'react-native';
import { useNow } from '@/lib/platform';
import { formatClock } from '@/lib/workout';
import { colors, radius } from '@/theme';
import { Icon } from './Icon';
import { Button, ProgressBar, Txt } from './ui';

export type Rest = { end: number; total: number };

/** Contagem do descanso entre séries; some sozinho e vibra ao terminar. */
export function RestTimer({ rest, onChange, bottom }: { rest?: Rest; onChange: (rest?: Rest) => void; bottom: number }) {
  const now = useNow(250);
  const left = rest ? rest.end - now : 0;
  const over = rest !== undefined && left <= 0;

  useEffect(() => {
    if (!over) return;
    Vibration.vibrate(500);
    onChange(undefined);
  }, [over, onChange]);

  if (!rest || over) return null;
  const shift = (ms: number) => onChange({ end: rest.end + ms, total: Math.max(1000, rest.total + ms) });

  return (
    <View style={[s.bar, { bottom }]} accessibilityLiveRegion="polite">
      <ProgressBar value={left / rest.total} style={s.progress} />
      <View style={s.row}>
        <View style={s.time}>
          <View style={s.labelRow}>
            <Icon name="timer" size={14} color={colors.accent} />
            <Txt v="label" style={{ color: colors.accent }}>Descanso</Txt>
          </View>
          <Txt v="num" style={s.clock}>{formatClock(left)}</Txt>
        </View>
        <Button small variant="secondary" label="−0:15" onPress={() => shift(-15_000)} />
        <Button small variant="secondary" label="+0:15" onPress={() => shift(15_000)} />
        <Button small label="Pular" onPress={() => onChange(undefined)} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute', left: 12, right: 12, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: 14, paddingTop: 12, gap: 10, borderWidth: 1, borderColor: colors.line,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
  progress: { height: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  time: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clock: { fontSize: 36, lineHeight: 40 },
});
