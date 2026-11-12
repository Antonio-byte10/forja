import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { catalog, muscleGroups, type MuscleGroup } from '@/data/catalog';
import type { PlanExercise } from '@/lib/types';
import { porTempo, uid } from '@/lib/workout';
import { colors, fonts, radius } from '@/theme';
import { Icon } from './Icon';
import { ExerciseImage, IconButton, Txt } from './ui';

const items = Object.entries(catalog).map(([key, item]) => ({ key, ...item }));
const normalize = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const ROTULO = { carga: 'carga', reps: 'peso do corpo', tempo: 'por tempo', cardio: 'tempo e distância', alongamento: 'por tempo' };

type Props = { visible: boolean; onClose: () => void; onPick: (exercise: PlanExercise) => void };

/** Escolhe um exercício do catálogo ou cria um com nome próprio. */
export function ExercisePicker({ visible, onClose, onPick }: Props) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<MuscleGroup>();
  const filtered = items.filter((i) => (!group || i.group === group) && normalize(i.name).includes(normalize(query)));
  const typed = query.trim();

  // Séries e metas iniciais dependem de como o exercício é medido.
  const pick = ({ medida, ...exercise }: Pick<PlanExercise, 'name' | 'catalogKey' | 'unilateral' | 'medida'>) => {
    const m = medida ?? 'carga';
    onPick({
      id: uid(), weight: 0,
      sets: m === 'cardio' || m === 'alongamento' ? 1 : 3,
      reps: porTempo(m) ? 0 : 10,
      ...(porTempo(m) && { seconds: m === 'cardio' ? 1200 : 30 }),
      ...(medida && { medida }),
      ...exercise,
    });
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsBar} contentContainerStyle={s.chips}>
          {[undefined, ...muscleGroups].map((g) => {
            const on = g === group;
            return (
              <Pressable
                key={g ?? 'todos'}
                onPress={() => setGroup(g)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={({ pressed }) => [s.chip, on && s.chipOn, pressed && s.pressed]}
              >
                <Txt style={[s.chipText, on && { color: colors.onAccent }]}>{g ?? 'Todos'}</Txt>
              </Pressable>
            );
          })}
        </ScrollView>
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
          ListEmptyComponent={
            <Txt v="sub" style={{ textAlign: 'center', marginTop: 12 }}>
              {group ? `Nada em ${group} com esse nome.` : 'Nada no catálogo com esse nome.'}
            </Txt>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => pick({ name: item.name, catalogKey: item.key, unilateral: item.unilateral, medida: item.medida })}
              accessibilityRole="button"
              style={({ pressed }) => [s.item, pressed && s.pressed]}
            >
              <ExerciseImage catalogKey={item.key} name={item.name} size={48} />
              <View style={{ flex: 1 }}>
                <Txt style={s.name}>{item.name}</Txt>
                <Txt v="sub">{item.group}{item.unilateral ? ' · carga por lado' : ''}{item.medida ? ` · ${ROTULO[item.medida]}` : ''}</Txt>
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
    flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, marginBottom: 0, paddingHorizontal: 14,
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, height: 50,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 16, height: '100%' },
  chipsBar: { flexGrow: 0, flexShrink: 0, minHeight: 60 },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.surface, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.accent },
  chipText: { fontFamily: fonts.semibold, fontSize: 14 },
  list: { gap: 8, padding: 16, paddingTop: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: radius.md, padding: 10, paddingRight: 14 },
  create: { borderWidth: 1, borderColor: colors.accent, borderStyle: 'dashed' },
  createIcon: { width: 72, height: 48, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  name: { fontFamily: fonts.semibold, fontSize: 15 },
});
