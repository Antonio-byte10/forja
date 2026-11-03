import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { catalog } from '@/data/catalog';
import type { PlanExercise } from '@/lib/types';
import { uid } from '@/lib/workout';
import { colors, fonts, radius } from '@/theme';
import { Icon } from './Icon';
import { ExerciseImage, IconButton, Txt } from './ui';

const items = Object.entries(catalog).map(([key, item]) => ({ key, ...item }));
const normalize = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

type Props = { visible: boolean; onClose: () => void; onPick: (exercise: PlanExercise) => void };

/** Escolhe um exercício do catálogo ou cria um com nome próprio. */
export function ExercisePicker({ visible, onClose, onPick }: Props) {
  const [query, setQuery] = useState('');
  const filtered = items.filter((i) => normalize(i.name).includes(normalize(query)));
  const typed = query.trim();

  const pick = (exercise: Omit<PlanExercise, 'id' | 'sets' | 'reps' | 'weight'>) => {
    onPick({ id: uid(), sets: 3, reps: 10, weight: 0, ...exercise });
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.screen}>
        <View style={s.top}>
          <Txt v="title" style={{ flex: 1 }}>Adicionar exercício</Txt>
          <IconButton icon="x" label="Fechar" onPress={onClose} filled />
        </View>
        <View style={s.search}>
          <Icon name="search" size={18} color={colors.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar exercício"
            placeholderTextColor={colors.faint}
            style={s.searchInput}
            accessibilityLabel="Buscar exercício"
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.key}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            typed ? (
              <Pressable
                onPress={() => pick({ name: typed, unilateral: false })}
                accessibilityRole="button"
                style={({ pressed }) => [s.item, s.create, pressed && s.pressed]}
              >
                <View style={s.createIcon}>
                  <Icon name="plus" size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt style={s.name}>Criar “{typed}”</Txt>
                  <Txt v="sub">Exercício sem foto, com o nome que você digitou</Txt>
                </View>
              </Pressable>
            ) : undefined
          }
          ListEmptyComponent={<Txt v="sub" style={{ textAlign: 'center', marginTop: 12 }}>Nada no catálogo com esse nome.</Txt>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => pick({ name: item.name, catalogKey: item.key, unilateral: item.unilateral })}
              accessibilityRole="button"
              style={({ pressed }) => [s.item, pressed && s.pressed]}
            >
              <ExerciseImage catalogKey={item.key} name={item.name} size={48} />
              <View style={{ flex: 1 }}>
                <Txt style={s.name}>{item.name}</Txt>
                {item.unilateral && <Txt v="sub">Carga por lado</Txt>}
              </View>
              <Icon name="plus" size={20} color={colors.faint} />
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, marginBottom: 4, paddingHorizontal: 14,
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, height: 50,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 16, height: '100%' },
  list: { gap: 8, padding: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: radius.md, padding: 10, paddingRight: 14 },
  create: { borderWidth: 1, borderColor: colors.accent, borderStyle: 'dashed' },
  createIcon: { width: 72, height: 48, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  name: { fontFamily: fonts.semibold, fontSize: 15 },
});
