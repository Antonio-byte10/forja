import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Button, Card, Txt } from '@/components/ui';
import { confirm } from '@/lib/platform';
import { countSets, exerciseVolume, formatKg, sessionVolume, summarizeSets, volumeChange } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, fonts, radius } from '@/theme';

export default function Historico() {
  const { history, deleteSession } = useStore();
  const [open, setOpen] = useState<string>();
  const { top } = useSafeAreaInsets();

  return (
    <FlatList
      style={s.screen}
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[s.list, { paddingTop: top + 16 }]}
      ListHeaderComponent={
        <View style={s.header}>
          <Txt v="hero">Histórico</Txt>
          <MonthCalendar history={history} />
          {history.length > 0 && <Txt v="label" style={{ marginTop: 8 }}>Treinos</Txt>}
        </View>
      }
      ListEmptyComponent={
        <Card style={s.empty}>
          <Icon name="calendar" size={28} color={colors.faint} />
          <Txt v="h2">Nenhum treino ainda</Txt>
          <Txt v="sub" style={{ textAlign: 'center' }}>Quando você finalizar o primeiro treino, ele aparece aqui com volume e séries.</Txt>
        </Card>
      }
      renderItem={({ item }) => {
        const change = volumeChange(history, item);
        const minutes = Math.round(((item.finishedAt ?? item.startedAt) - item.startedAt) / 60_000);
        const date = new Date(item.startedAt);
        const isOpen = open === item.id;
        const remove = async () => {
          if (await confirm('Apagar este treino?', 'Não dá para desfazer.', 'Apagar')) deleteSession(item.id);
        };
        return (
          <View style={s.card}>
            <Pressable
              onPress={() => setOpen(isOpen ? undefined : item.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              style={({ pressed }) => [s.summary, pressed && s.pressed]}
            >
              <View style={s.date}>
                <Txt style={s.dateDay}>{date.getDate()}</Txt>
                <Txt v="label" style={s.dateWeek}>{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</Txt>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt v="h2" numberOfLines={1}>Ficha {item.planName}{item.planTitle ? ` · ${item.planTitle}` : ''}</Txt>
                <Txt v="sub">
                  {date.toLocaleDateString('pt-BR', { weekday: 'long' })} · {minutes} min · {countSets(item).done} séries
                </Txt>
              </View>
              <View style={s.right}>
                <Txt style={s.volume}>{formatKg(sessionVolume(item))}<Txt v="sub"> kg</Txt></Txt>
                {change !== undefined && (
                  <View style={s.trend}>
                    <Icon name={change >= 0 ? 'trendUp' : 'trendDown'} size={13} color={change >= 0 ? colors.up : colors.danger} />
                    <Txt style={[s.trendText, { color: change >= 0 ? colors.up : colors.danger }]}>{Math.abs(change)}%</Txt>
                  </View>
                )}
              </View>
            </Pressable>
            {isOpen && (
              <View style={s.details}>
                {item.exercises.map((ex, i) => {
                  const done = ex.sets.filter((x) => x.done);
                  if (!done.length) return null;
                  return (
                    <View key={i} style={s.exercise}>
                      <View style={s.exRow}>
                        <Txt style={s.exName} numberOfLines={1}>{ex.name}</Txt>
                        <Txt v="sub">{formatKg(exerciseVolume(ex))} kg</Txt>
                      </View>
                      <Txt v="sub">{summarizeSets(done)}{ex.unilateral ? ' (por lado)' : ''}</Txt>
                    </View>
                  );
                })}
                <Button small variant="danger" icon="trash" label="Apagar treino" onPress={remove} style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} />
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  header: { gap: 16, marginBottom: 2 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 28 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  pressed: { opacity: 0.7 },
  date: { width: 48, height: 52, borderRadius: radius.md, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontFamily: fonts.displayHeavy, fontSize: 24, lineHeight: 26, color: colors.text },
  dateWeek: { fontSize: 10, letterSpacing: 0.8 },
  right: { alignItems: 'flex-end', gap: 2 },
  volume: { fontFamily: fonts.display, fontSize: 20, color: colors.text },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendText: { fontFamily: fonts.semibold, fontSize: 12 },
  details: { borderTopWidth: 1, borderColor: colors.line, padding: 14, gap: 12 },
  exercise: { gap: 2 },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  exName: { fontFamily: fonts.semibold, flexShrink: 1 },
});
