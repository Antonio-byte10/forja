import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Session } from '@/lib/types';
import { semanasSeguidas, totals } from '@/lib/workout';
import { colors, fonts } from '@/theme';
import { Icon } from './Icon';
import { dataLocal } from '@/lib/datas';
import { useStore } from '@/store';
import { Card, IconButton, ProgressBar, Txt } from './ui';

const LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Domingo a sábado da semana atual, com os dias treinados marcados. */
export function WeekStrip({ history }: { history: Session[] }) {
  const today = new Date();
  const trained = new Set(history.map((s) => dataLocal(s.startedAt)));
  const days = Array.from({ length: 7 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + i));
  // Conta treinos (dois no mesmo dia valem dois) e o tempo somado da semana.
  const { sessions: count, minutes } = totals(history, days[0].getTime(), days[6].getTime() + 86_400_000);
  const meta = useStore((st) => st.ajustes.metaSemanal);
  const [editando, setEditando] = useState(false);
  const sequencia = semanasSeguidas(history, meta, today.getTime());
  const mudarMeta = (n: number) => useStore.getState().setAjustes({ metaSemanal: Math.min(14, Math.max(1, n)) });

  return (
    <Card style={s.card}>
      <View style={s.head}>
        <Txt v="label">Esta semana</Txt>
        <Pressable
          onPress={() => setEditando((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={`${count} de ${meta} treinos na semana. Toque para mudar a meta.`}
          hitSlop={8}
        >
          <Txt v="label" style={{ color: count >= meta ? colors.up : count ? colors.accent : colors.faint }}>
            {count}/{meta} treinos{minutes ? ` · ${minutes} min` : ''}
          </Txt>
        </Pressable>
      </View>
      {editando && (
        <View style={s.meta}>
          <Txt v="sub" style={{ flex: 1 }}>Meta: treinos por semana</Txt>
          <IconButton icon="minus" label="Diminuir meta" onPress={() => mudarMeta(meta - 1)} disabled={meta <= 1} size={36} filled />
          <Txt v="num" style={{ minWidth: 28, textAlign: 'center' }}>{meta}</Txt>
          <IconButton icon="plus" label="Aumentar meta" onPress={() => mudarMeta(meta + 1)} disabled={meta >= 14} size={36} filled />
        </View>
      )}
      <View style={s.row}>
        {days.map((d, i) => {
          const done = trained.has(dataLocal(d));
          const isToday = dataLocal(d) === dataLocal(today);
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
      <ProgressBar value={count / meta} style={s.progress} />
      {sequencia > 0 && (
        <View style={s.streak}>
          <Icon name="flame" size={14} color={colors.accent} fill={colors.accent} />
          <Txt v="sub" style={{ fontSize: 13 }}>
            {sequencia === 1 ? '1 semana' : `${sequencia} semanas`} seguidas batendo a meta
          </Txt>
        </View>
      )}
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
  progress: { height: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
