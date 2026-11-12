import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Button, ExerciseImage, Txt } from '@/components/ui';
import { useStore } from '@/store';
import { colors, fonts, radius } from '@/theme';

export default function Fichas() {
  const plans = useStore((s) => s.plans);
  const { top } = useSafeAreaInsets();

  return (
    <ScrollView style={s.screen} contentContainerStyle={[s.content, { paddingTop: top + 16 }]}>
      <View style={s.head}>
        <Txt v="hero">Fichas</Txt>
        <Txt v="sub">O app sugere a próxima da academia na ordem; as de casa ficam à parte. Toque numa ficha para editar.</Txt>
      </View>

      {plans.map((plan) => {
        const sets = plan.exercises.reduce((n, e) => n + e.sets, 0);
        return (
          <Pressable
            key={plan.id}
            onPress={() => router.push(`/ficha/${plan.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Editar ficha ${plan.name}, ${plan.title}`}
            style={({ pressed }) => [s.card, pressed && s.pressed]}
          >
            <View style={s.top}>
              <View style={s.letter}>
                <Txt style={s.letterText}>{plan.name}</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="h2" numberOfLines={1}>{plan.title || 'Sem nome'}</Txt>
                <Txt v="sub">
                  {plan.lugar === 'casa' ? 'Em casa · ' : ''}{plan.exercises.length === 1 ? '1 exercício' : `${plan.exercises.length} exercícios`} · {sets} séries
                </Txt>
              </View>
              <Icon name="chevronRight" size={20} color={colors.faint} />
            </View>
            {plan.exercises.length > 0 && (
              <View style={s.thumbs}>
                {plan.exercises.slice(0, 4).map((e) => (
                  <ExerciseImage key={e.id} catalogKey={e.catalogKey} name={e.name} size={40} />
                ))}
                {plan.exercises.length > 4 && (
                  <View style={s.more}>
                    <Txt style={s.moreText}>+{plan.exercises.length - 4}</Txt>
                  </View>
                )}
              </View>
            )}
          </Pressable>
        );
      })}

      <Button variant="ghost" icon="plus" label="Nova ficha" onPress={() => router.push('/ficha/nova')} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  head: { gap: 4, marginBottom: 8 },
  pressed: { opacity: 0.7 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  letter: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  letterText: { fontFamily: fonts.displayHeavy, fontSize: 32, lineHeight: 38, color: colors.accent },
  thumbs: { flexDirection: 'row', gap: 6 },
  more: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontFamily: fonts.display, fontSize: 16, color: colors.sub },
});
