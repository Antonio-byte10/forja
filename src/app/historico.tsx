import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { confirm } from '@/lib/platform';
import { exerciseVolume, formatKg, sessionVolume, summarizeSets, volumeChange } from '@/lib/workout';
import { useStore } from '@/store';
import { colors } from '@/theme';

export default function Historico() {
  const { history, deleteSession } = useStore();
  const [open, setOpen] = useState<string>();

  return (
    <FlatList
      data={history}
      keyExtractor={(s) => s.id}
      contentContainerStyle={s.list}
      ListEmptyComponent={
        <Text style={s.empty}>Nenhum treino finalizado ainda. Quando você finalizar o primeiro, ele aparece aqui.</Text>
      }
      renderItem={({ item }) => {
        const change = volumeChange(history, item);
        const minutes = Math.round(((item.finishedAt ?? item.startedAt) - item.startedAt) / 60_000);
        const remove = async () => {
          if (await confirm('Apagar este treino?', 'Não dá para desfazer.', 'Apagar')) deleteSession(item.id);
        };
        const isOpen = open === item.id;
        return (
          <Card style={{ gap: 6 }}>
            <Pressable
              onPress={() => setOpen(isOpen ? undefined : item.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              style={({ pressed }) => [s.summary, pressed && s.pressed]}
            >
              <View style={s.row}>
                <Text style={s.title}>Ficha {item.planName}</Text>
                <Text style={s.volume}>{formatKg(sessionVolume(item))} kg</Text>
              </View>
              {change !== undefined && (
                <Text style={change >= 0 ? s.up : s.down}>
                  {change >= 0 ? '▲' : '▼'} {Math.abs(change)}% de volume vs. a última Ficha {item.planName}
                </Text>
              )}
              <Text style={s.muted}>
                {new Date(item.startedAt).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                {' · '}{item.planTitle} · {minutes} min
              </Text>
            </Pressable>
            {isOpen && (
              <View style={s.details}>
                {item.exercises.map((ex, i) => {
                  const done = ex.sets.filter((x) => x.done);
                  if (!done.length) return null;
                  return (
                    <View key={i} style={s.exercise}>
                      <View style={s.row}>
                        <Text style={s.exName}>{ex.name}</Text>
                        <Text style={s.muted}>{formatKg(exerciseVolume(ex))} kg</Text>
                      </View>
                      <Text style={s.muted}>{summarizeSets(done)}{ex.unilateral ? ' (por lado)' : ''}</Text>
                    </View>
                  );
                })}
                <Pressable onPress={remove} accessibilityRole="button" style={s.deleteBtn}>
                  <Text style={s.delete}>Apagar treino</Text>
                </Pressable>
              </View>
            )}
          </Card>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  list: { padding: 16, gap: 10 },
  summary: { gap: 6 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40, lineHeight: 22 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  volume: { color: colors.accent, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 13 },
  details: { borderTopWidth: 1, borderColor: colors.border, marginTop: 6, paddingTop: 10, gap: 10 },
  exercise: { gap: 2 },
  exName: { color: colors.text, fontWeight: '700', flexShrink: 1 },
  deleteBtn: { minHeight: 44, justifyContent: 'center' },
  delete: { color: colors.danger, fontWeight: '700' },
  pressed: { opacity: 0.6 },
  up: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  down: { color: colors.muted, fontSize: 13, fontWeight: '700' },
});
