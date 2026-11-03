import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { catalog } from '@/data/catalog';
import type { PlanExercise } from '@/lib/types';
import { uid } from '@/lib/workout';
import { colors, radius } from '@/theme';
import { Button, ExerciseImage } from './ui';

const items = Object.entries(catalog).map(([key, item]) => ({ key, ...item }));
const normalize = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

type Props = { visible: boolean; onClose: () => void; onPick: (exercise: PlanExercise) => void };

/** Escolhe um exercício do catálogo ou cria um com nome próprio. */
export function ExercisePicker({ visible, onClose, onPick }: Props) {
  const [query, setQuery] = useState('');
  const filtered = items.filter((i) => normalize(i.name).includes(normalize(query)));

  const pick = (exercise: Omit<PlanExercise, 'id' | 'sets' | 'reps' | 'weight'>) => {
    onPick({ id: uid(), sets: 3, reps: 10, weight: 0, ...exercise });
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.screen}>
        <View style={s.top}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar exercício"
            placeholderTextColor={colors.muted}
            style={s.search}
            accessibilityLabel="Buscar exercício"
          />
          <Button small variant="ghost" label="Fechar" onPress={onClose} />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.key}
          contentContainerStyle={{ gap: 8, padding: 16 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            query.trim() ? (
              <Button variant="ghost" label={`+ Criar "${query.trim()}"`} onPress={() => pick({ name: query.trim(), unilateral: false })} />
            ) : undefined
          }
          renderItem={({ item }) => (
            <Pressable style={({ pressed }) => [s.item, pressed && { opacity: 0.6 }]} accessibilityRole="button" onPress={() => pick({ name: item.name, catalogKey: item.key, unilateral: item.unilateral })}>
              <ExerciseImage catalogKey={item.key} name={item.name} size={52} />
              <Text style={s.name}>{item.name}</Text>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0, alignItems: 'center' },
  search: { flex: 1, backgroundColor: colors.raised, color: colors.text, borderRadius: radius, padding: 12, fontSize: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius, padding: 8 },
  name: { color: colors.text, fontSize: 15, fontWeight: '600', flex: 1 },
});
