import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Button, Card } from '@/components/ui';
import type { Plan } from '@/lib/types';
import { formatKg, nextPlan, sessionVolume, volumeChange } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, radius } from '@/theme';

const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const daysAgo = (t: number) => {
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(t).setHours(0, 0, 0, 0)) / 86_400_000);
  return days === 0 ? 'hoje' : days === 1 ? 'ontem' : `há ${days} dias`;
};

export default function Home() {
  const { plans, history, active, start } = useStore();
  const next = nextPlan(plans, history);
  const last = history[0];
  const change = last ? volumeChange(history, last) : undefined;

  const begin = (plan: Plan) => {
    start(plan.id);
    router.push('/treino');
  };

  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.date}>{capitalize(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))}</Text>
        <Text style={s.hello}>Bora treinar</Text>

        {active ? (
          <Card style={s.hero}>
            <Text style={s.kicker}>EM ANDAMENTO</Text>
            <Text style={s.heroTitle}>Ficha {active.planName}</Text>
            <Text style={s.muted}>{active.planTitle}</Text>
            <Button label="Continuar treino" onPress={() => router.push('/treino')} />
          </Card>
        ) : next ? (
          <Card style={s.hero}>
            <Text style={s.kicker}>PRÓXIMO TREINO</Text>
            <Text style={s.heroTitle}>Ficha {next.name}</Text>
            <Text style={s.muted}>{next.title} · {next.exercises.length} exercícios</Text>
            <Button label="Começar treino" onPress={() => begin(next)} disabled={!next.exercises.length} />
            {plans.length > 1 && (
              <View style={s.others}>
                <Text style={s.othersTitle}>OU FAZER OUTRA</Text>
                {plans.filter((p) => p.id !== next.id).map((p) => (
                  <Pressable
                    key={p.id}
                    style={({ pressed }) => [s.other, pressed && s.pressed]}
                    onPress={() => begin(p)}
                    disabled={!p.exercises.length}
                    accessibilityRole="button"
                    accessibilityLabel={`Começar ficha ${p.name}, ${p.title}`}
                  >
                    <Text style={s.otherLetter}>{p.name}</Text>
                    <Text style={s.otherTitle} numberOfLines={1}>{p.title || 'Sem nome'}</Text>
                    <Text style={s.otherGo}>›</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Card>
        ) : (
          <Card style={s.hero}>
            <Text style={s.heroTitle}>Nenhuma ficha</Text>
            <Button label="Criar ficha" onPress={() => router.push('/fichas/nova')} />
          </Card>
        )}

        {last && (
          <Text style={s.last}>
            Último: Ficha {last.planName}, {daysAgo(last.startedAt)} · {formatKg(sessionVolume(last))} kg de volume
            {change !== undefined && (
              <Text style={change >= 0 ? s.up : s.down}>{`  ${change >= 0 ? '▲' : '▼'} ${Math.abs(change)}% vs. anterior`}</Text>
            )}
          </Text>
        )}

        <MonthCalendar history={history} />

        <View style={s.nav}>
          {([['Fichas', '/fichas'], ['Histórico', '/historico'], ['Backup', '/backup']] as const).map(([label, href]) => (
            <Pressable key={href} style={({ pressed }) => [s.navItem, pressed && s.pressed]} onPress={() => router.push(href)} accessibilityRole="button">
              <Text style={s.navText}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  date: { color: colors.muted, fontSize: 14, marginTop: 8 },
  hello: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: -10 },
  hero: { gap: 8, borderColor: colors.accent },
  kicker: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: colors.text, fontSize: 34, fontWeight: '900' },
  muted: { color: colors.muted, fontSize: 14, marginBottom: 6 },
  pressed: { opacity: 0.6 },
  others: { gap: 8, marginTop: 10 },
  othersTitle: { color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  other: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.raised, borderRadius: 12, paddingHorizontal: 14, minHeight: 52 },
  otherLetter: { color: colors.accent, fontSize: 20, fontWeight: '900', width: 24, textAlign: 'center' },
  otherTitle: { color: colors.text, fontSize: 15, fontWeight: '600', flex: 1 },
  otherGo: { color: colors.muted, fontSize: 22 },
  last: { color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  up: { color: colors.accent, fontWeight: '700' },
  down: { color: colors.muted, fontWeight: '700' },
  nav: { flexDirection: 'row', gap: 8 },
  navItem: { flex: 1, backgroundColor: colors.card, borderRadius: radius, minHeight: 52, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  navText: { color: colors.text, fontWeight: '700' },
});
