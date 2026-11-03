import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, ExerciseImage } from '@/components/ui';
import { useStore } from '@/store';
import { colors } from '@/theme';

export default function Fichas() {
  const plans = useStore((s) => s.plans);

  return (
    <ScrollView contentContainerStyle={s.list}>
      {plans.map((plan) => (
        <Pressable
          key={plan.id}
          onPress={() => router.push(`/fichas/${plan.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Editar ficha ${plan.name}, ${plan.title}`}
          style={({ pressed }) => pressed && s.pressed}
        >
          <Card style={s.card}>
            <Text style={s.letter}>{plan.name}</Text>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={s.title}>{plan.title || 'Sem nome'}</Text>
              <Text style={s.muted}>{plan.exercises.length === 1 ? '1 exercício' : `${plan.exercises.length} exercícios`}</Text>
              <View style={s.thumbs}>
                {plan.exercises.slice(0, 5).map((e) => (
                  <ExerciseImage key={e.id} catalogKey={e.catalogKey} name={e.name} size={28} />
                ))}
              </View>
            </View>
          </Card>
        </Pressable>
      ))}
      <Button variant="ghost" label="+ Nova ficha" onPress={() => router.push('/fichas/nova')} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  list: { padding: 16, gap: 10 },
  pressed: { opacity: 0.6 },
  card: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  letter: { color: colors.accent, fontSize: 40, fontWeight: '900', width: 44, textAlign: 'center' },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 13 },
  thumbs: { flexDirection: 'row', gap: 6 },
});
