import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Session } from '@/lib/types';
import { dataLocal } from '@/lib/nutricao';
import { useStore } from '@/store';
import { colors, fonts } from '@/theme';
import { Card, IconButton, Txt } from './ui';

const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Um mês com os dias de treino marcados; setas para ver os meses anteriores. */
export function MonthCalendar({ history }: { history: Session[] }) {
  const [offset, setOffset] = useState(0);
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const year = first.getFullYear();
  const month = first.getMonth();
  const trained = useMemo(() => new Set(history.map((s) => dataLocal(s.startedAt))), [history]);
  const pesos = useStore((st) => st.pesos);
  const fotos = useStore((st) => st.fotos);
  const nutricao = useStore((st) => st.nutricao);
  const registros = useMemo(() => new Set([...Object.keys(nutricao.diario), ...Object.keys(nutricao.planos),
    ...pesos.map((p) => dataLocal(p.t)), ...fotos.map((f) => dataLocal(f.t))]), [nutricao, pesos, fotos]);
  const blanks = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const count = history.filter((sessao) => {
    const data = new Date(sessao.startedAt);
    return data.getFullYear() === year && data.getMonth() === month;
  }).length;
  const title = first.toLocaleDateString('pt-BR', { month: 'long', ...(year !== today.getFullYear() && { year: 'numeric' }) });

  return (
    <Card style={{ gap: 12 }}>
      <View style={s.head}>
        <IconButton icon="chevronLeft" label="Mês anterior" onPress={() => setOffset((o) => o - 1)} size={36} />
        <View style={s.title}>
          <Txt v="h2" style={s.month}>{title}</Txt>
          <Txt v="label" style={{ color: count ? colors.accent : colors.faint }}>
            {count === 1 ? '1 treino' : `${count} treinos`}
          </Txt>
        </View>
        <IconButton icon="chevronRight" label="Próximo mês" onPress={() => setOffset((o) => o + 1)} disabled={offset >= 0} size={36} />
      </View>
      <View style={s.grid}>
        {WEEK.map((d, i) => (
          <Txt key={`w${i}`} v="label" style={[s.cell, s.week]}>{d}</Txt>
        ))}
        {Array.from({ length: blanks }, (_, i) => <View key={`b${i}`} style={s.cell} />)}
        {Array.from({ length: days }, (_, i) => {
          const date = new Date(year, month, i + 1);
          const dia = dataLocal(date);
          const done = trained.has(dia);
          const isToday = dia === dataLocal(today);
          const registrado = registros.has(dia);
          return (
            <Pressable key={i} style={s.cell} disabled={date > today} accessibilityRole="button"
              accessibilityLabel={date.toLocaleDateString('pt-BR') + (done ? ', com treino' : '') + (registrado ? ', com registro' : '')}
              onPress={() => router.push({ pathname: '/diario/[data]', params: { data: dia } })}>
              <View style={[s.day, done && s.done, isToday && !done && s.today]}>
                <Txt style={[s.dayText, done && { color: colors.onAccent, fontFamily: fonts.bold }, date > today && { color: colors.faint }]}>
                  {i + 1}
                </Txt>
                {registrado && <View style={{ position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: done ? colors.onAccent : colors.accent }} />}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Txt v="sub">Toque em um dia para abrir o diário. O ponto indica um registro de bem-estar.</Txt>
    </Card>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, alignItems: 'center' },
  month: { textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  week: { textAlign: 'center', letterSpacing: 0 },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  done: { backgroundColor: colors.accent },
  today: { borderWidth: 2, borderColor: colors.accent },
  dayText: { fontFamily: fonts.medium, fontSize: 14 },
});
