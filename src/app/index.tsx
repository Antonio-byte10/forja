import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Button, Card } from '@/components/ui';
import type { Plan } from '@/lib/types';
import { formatKg, nextPlan, sessionVolume } from '@/lib/workout';
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
                <Text style={s.muted}>Ou fazer outra:</Text>
                {plans.filter((p) => p.id !== next.id).map((p) => (
                  <Pressable key={p.id} style={s.chip} onPress={() => begin(p)} disabled={!p.exercises.length}>
                    <Text style={s.chipText}>{p.name}</Text>
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
          </Text>
        )}

        <MonthCalendar history={history} />

        <View style={s.nav}>
          {([['Fichas', '/fichas'], ['Histórico', '/historico'], ['Backup', '/backup']] as const).map(([label, href]) => (
            <Pressable key={href} style={s.navItem} onPress={() => router.push(href)}>
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
  others: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  chip: { backgroundColor: colors.raised, borderRadius: 10, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  chipText: { color: colors.text, fontWeight: '800', fontSize: 16 },
  last: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  nav: { flexDirection: 'row', gap: 8 },
  navItem: { flex: 1, backgroundColor: colors.card, borderRadius: radius, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  navText: { color: colors.text, fontWeight: '700' },
});
