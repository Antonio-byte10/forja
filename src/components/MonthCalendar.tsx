import { StyleSheet, Text, View } from 'react-native';
import type { Session } from '@/lib/types';
import { dayKey } from '@/lib/workout';
import { colors } from '@/theme';
import { Card } from './ui';

const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Mês atual com os dias de treino marcados. */
export function MonthCalendar({ history }: { history: Session[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const trained = new Set(history.map((s) => dayKey(s.startedAt)));
  const blanks = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const count = Array.from({ length: days }, (_, d) => trained.has(dayKey(new Date(year, month, d + 1)))).filter(Boolean).length;
  const title = today.toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <Card>
      <View style={s.head}>
        <Text style={s.title}>{title.charAt(0).toUpperCase() + title.slice(1)}</Text>
        <Text style={s.count}>{count} {count === 1 ? 'treino' : 'treinos'}</Text>
      </View>
      <View style={s.grid}>
        {WEEK.map((d, i) => (
          <Text key={`w${i}`} style={[s.cell, s.week]}>{d}</Text>
        ))}
        {Array.from({ length: blanks }, (_, i) => <View key={`b${i}`} style={s.cell} />)}
        {Array.from({ length: days }, (_, i) => {
          const done = trained.has(dayKey(new Date(year, month, i + 1)));
          const isToday = i + 1 === today.getDate();
          return (
            <View key={i} style={s.cell}>
              <View style={[s.day, done && s.done, isToday && !done && s.today]}>
                <Text style={[s.dayText, done && { color: colors.onAccent, fontWeight: '800' }]}>{i + 1}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  title: { color: colors.text, fontWeight: '800', fontSize: 16 },
  count: { color: colors.accent, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  week: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  day: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  done: { backgroundColor: colors.accent },
  today: { borderWidth: 1, borderColor: colors.muted },
  dayText: { color: colors.text, fontSize: 13 },
});
