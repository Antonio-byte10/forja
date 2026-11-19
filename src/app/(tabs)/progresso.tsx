import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Card, ExerciseImage, Txt } from '@/components/ui';
import { catalog } from '@/data/catalog';
import { daysAgo, exerciciosFeitos, formatKg, seriesPorGrupo } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, fonts, radius } from '@/theme';

const DIA = 86_400_000;
/** Faixa comum para ganhar massa: cerca de 10 a 20 séries por grupo muscular na semana. */
const ALVO_MIN = 10;
const ALVO_MAX = 20;
const SEM_META = new Set(['Cardio', 'Alongamento', 'Condicionamento']);
const PERIODOS = [
  [7, 'Últimos 7 dias'],
  [28, 'Média de 4 semanas'],
] as const;

export default function Progresso() {
  const history = useStore((st) => st.history);
  const { top } = useSafeAreaInsets();
  const [dias, setDias] = useState<7 | 28>(7);
  const [todos, setTodos] = useState(false);
  const [agora] = useState(Date.now);

  const grupos = useMemo(() => {
    const semanas = dias / 7;
    return seriesPorGrupo(history, agora - dias * DIA, agora + DIA, (e) => (e.catalogKey ? catalog[e.catalogKey]?.group : undefined))
      .map(([g, n]) => [g, Math.round((n / semanas) * 10) / 10] as const);
  }, [history, dias, agora]);
  const exercicios = useMemo(() => exerciciosFeitos(history), [history]);
  const lista = todos ? exercicios : exercicios.slice(0, 8);

  return (
    <ScrollView style={s.screen} contentContainerStyle={[s.content, { paddingTop: top + 16 }]}>
      <Txt v="hero">Progresso</Txt>

      <Card style={{ gap: 14 }}>
        <View style={s.headRow}>
          <Txt v="h2" style={{ flex: 1 }}>Séries por grupo</Txt>
          <Txt v="label">por semana</Txt>
        </View>
        <View style={s.chips}>
          {PERIODOS.map(([d, rotulo]) => (
            <Pressable
              key={d}
              onPress={() => setDias(d)}
              accessibilityRole="button"
              accessibilityState={{ selected: d === dias }}
              style={[s.chip, d === dias && s.chipOn]}
            >
              <Txt style={[s.chipText, d === dias && { color: colors.onAccent }]}>{rotulo}</Txt>
            </Pressable>
          ))}
        </View>
        {grupos.length === 0 ? (
          <Txt v="sub">Nenhuma série feita nesse período.</Txt>
        ) : (
          grupos.map(([g, n]) => {
            const meta = !SEM_META.has(g);
            const cor = !meta ? colors.sub : n >= ALVO_MIN ? colors.up : colors.accent;
            return (
              <View key={g} style={{ gap: 4 }}>
                <View style={s.headRow}>
                  <Txt style={{ flex: 1, fontFamily: fonts.medium }}>{g}</Txt>
                  <Txt style={{ fontFamily: fonts.display, fontSize: 17, color: cor }}>{formatKg(n)}</Txt>
                </View>
                <View style={s.track}>
                  <View style={[s.fill, { width: `${Math.min(100, (n / ALVO_MAX) * 100)}%`, backgroundColor: cor }]} />
                  {meta && <View style={[s.mark, { left: `${(ALVO_MIN / ALVO_MAX) * 100}%` }]} />}
                </View>
              </View>
            );
          })
        )}
        <Txt v="sub" style={{ fontSize: 12 }}>
          A marca na barra é {ALVO_MIN} séries: perto de {ALVO_MIN}–{ALVO_MAX} por semana costuma ser bom para ganhar massa.
          Exercícios criados por você (fora do catálogo) não entram aqui.
        </Txt>
      </Card>

      <View style={s.headRow}>
        <Txt v="label" style={{ flex: 1 }}>Seus exercícios</Txt>
        {exercicios.length > 8 && (
          <Pressable onPress={() => setTodos((v) => !v)} accessibilityRole="button" hitSlop={8}>
            <Txt v="label" style={{ color: colors.accent }}>{todos ? 'Ver menos' : `Ver todos (${exercicios.length})`}</Txt>
          </Pressable>
        )}
      </View>
      {exercicios.length === 0 && (
        <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 24 }}>
          <Icon name="chart" size={28} color={colors.faint} />
          <Txt v="sub" style={{ textAlign: 'center' }}>Depois do primeiro treino, cada exercício aparece aqui com o gráfico de evolução.</Txt>
        </Card>
      )}
      {lista.map((e) => (
        <Pressable
          key={e.key}
          onPress={() => router.push({ pathname: '/exercicio/[key]', params: { key: e.key } })}
          accessibilityRole="button"
          accessibilityLabel={`Evolução de ${e.name}`}
          style={({ pressed }) => [s.item, pressed && { opacity: 0.7 }]}
        >
          <ExerciseImage catalogKey={e.catalogKey} name={e.name} size={36} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontFamily: fonts.semibold }} numberOfLines={1}>{e.name}</Txt>
            <Txt v="sub" numberOfLines={1}>{e.vezes}× · {daysAgo(e.ultimo)}</Txt>
          </View>
          {e.recorde > 0 && (
            <View style={{ alignItems: 'flex-end' }}>
              <Txt v="label">Recorde</Txt>
              <Txt style={{ fontFamily: fonts.display, fontSize: 18 }}>{formatKg(e.recorde)} kg</Txt>
            </View>
          )}
          <Icon name="chevronRight" size={18} color={colors.faint} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.raised, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.accent },
  chipText: { fontFamily: fonts.semibold, fontSize: 13 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.raised, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  mark: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.text, opacity: 0.5 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12 },
});
