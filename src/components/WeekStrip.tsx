import { StyleSheet, View } from 'react-native';
import type { Session } from '@/lib/types';
import { dayKey, totals } from '@/lib/workout';
import { colors, fonts } from '@/theme';
import { Icon } from './Icon';
import { Card, Txt } from './ui';

const LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Domingo a sábado da semana atual, com os dias treinados marcados. */
export function WeekStrip({ history }: { history: Session[] }) {
  const today = new Date();
  const trained = new Set(history.map((s) => dayKey(s.startedAt)));
  const days = Array.from({ length: 7 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + i));
  // Conta treinos (dois no mesmo dia valem dois) e o tempo somado da semana.
  const { sessions: count, minutes } = totals(history, days[0].getTime(), days[6].getTime() + 86_400_000);

  return (
    <Card style={s.card}>
      <View style={s.head}>
        <Txt v="label">Esta semana</Txt>
        <Txt v="label" style={{ color: count ? colors.accent : colors.faint }}>
          {count === 1 ? '1 treino' : `${count} treinos`}{minutes ? ` · ${minutes} min` : ''}
        </Txt>
      </View>
      <View style={s.row}>
        {days.map((d, i) => {
          const done = trained.has(dayKey(d));
          const isToday = dayKey(d) === dayKey(today);
          const future = d > today && !isToday;
          return (
            <View key={i} style={s.day} accessibilityLabel={`${d.toLocaleDateString('pt-BR', { weekday: 'long' })}${done ? ', treinou' : ''}`}>
              <Txt v="label" style={[s.letter, isToday && { color: colors.text }]}>{LETTERS[i]}</Txt>
              <View style={[s.dot, done && s.done, isToday && !done && s.today]}>
                {done ? (
                  <Icon name="check" size={16} color={colors.onAccent} stroke={3} />
                ) : (
                  <Txt style={[s.num, future && { color: colors.faint }]}>{d.getDate()}</Txt>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  card: { gap: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 8, flex: 1 },
  letter: { letterSpacing: 0 },
  dot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.raised },
  done: { backgroundColor: colors.accent },
  today: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.accent },
  num: { fontFamily: fonts.semibold, fontSize: 14 },
});
