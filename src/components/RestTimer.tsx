import { useEffect } from 'react';
import { StyleSheet, Text, Vibration, View } from 'react-native';
import { useNow } from '@/lib/platform';
import { formatClock } from '@/lib/workout';
import { colors, radius } from '@/theme';
import { Button } from './ui';

/** Contagem do descanso entre séries; some sozinho e vibra ao terminar. */
export function RestTimer({ endAt, onChange, bottom }: { endAt?: number; onChange: (endAt?: number) => void; bottom: number }) {
  const now = useNow(250);
  const left = endAt ? endAt - now : 0;
  const over = endAt !== undefined && left <= 0;

  useEffect(() => {
    if (!over) return;
    Vibration.vibrate(500);
    onChange(undefined);
  }, [over, onChange]);

  if (!endAt || over) return null;
  return (
    <View style={[s.bar, { bottom }]}>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>Descanso</Text>
        <Text style={s.clock}>{formatClock(left)}</Text>
      </View>
      <Button small variant="ghost" label="−15s" onPress={() => onChange(endAt - 15_000)} />
      <Button small variant="ghost" label="+15s" onPress={() => onChange(endAt + 15_000)} />
      <Button small label="Pular" onPress={() => onChange(undefined)} />
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.raised, borderRadius: radius, padding: 12, borderWidth: 1, borderColor: colors.accent,
  },
  label: { color: colors.muted, fontSize: 12 },
  clock: { color: colors.text, fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
