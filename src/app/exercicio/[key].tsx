import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from '@/components/LineChart';
import { Card, ExerciseImage, ScreenHeader, Txt } from '@/components/ui';
import { catalog } from '@/data/catalog';
import { evolucao, exerciseKey, formatKg, formatSet, medidaDe } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, fonts, radius } from '@/theme';

const METRICAS = [
  ['carga', 'Maior carga'],
  ['e1rm', '1RM estimado'],
  ['volume', 'Volume'],
] as const;
type Metrica = (typeof METRICAS)[number][0];

/** Evolução de um exercício: gráfico e a lista de todas as vezes que ele foi feito. */
export default function Exercicio() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const history = useStore((st) => st.history);
  const { bottom } = useSafeAreaInsets();
  const [metrica, setMetrica] = useState<Metrica>('carga');
  const pontos = useMemo(() => evolucao(history, key), [history, key]);
  const vezes = useMemo(
    () => history.flatMap((s) => s.exercises.filter((e) => exerciseKey(e) === key && e.sets.some((x) => x.done)).map((e) => ({ s, e }))),
    [history, key],
  );
  const nome = vezes[0]?.e.name ?? catalog[key]?.name ?? key;
  const catalogKey = vezes[0]?.e.catalogKey;
  const melhor = pontos.length ? Math.max(...pontos.map((p) => p.carga)) : 0;
  const melhor1rm = pontos.length ? Math.max(...pontos.map((p) => p.e1rm)) : 0;

  return (
    <View style={s.screen}>
      <ScreenHeader kicker="Evolução" title={nome} />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: bottom + 32 }]}>
        <View style={s.top}>
          <ExerciseImage catalogKey={catalogKey} name={nome} size={64} />
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="sub">{vezes.length} {vezes.length === 1 ? 'treino' : 'treinos'}</Txt>
            {melhor > 0 && <Txt>Recorde: <Txt style={s.strong}>{formatKg(melhor)} kg</Txt></Txt>}
            {melhor1rm > 0 && <Txt v="sub">1RM estimado: {formatKg(melhor1rm)} kg</Txt>}
          </View>
        </View>

        {pontos.length > 0 ? (
          <Card style={{ gap: 12 }}>
            <View style={s.chips}>
              {METRICAS.map(([m, rotulo]) => (
                <Pressable
                  key={m}
                  onPress={() => setMetrica(m)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: m === metrica }}
                  style={[s.chip, m === metrica && s.chipOn]}
                >
                  <Txt style={[s.chipText, m === metrica && { color: colors.onAccent }]}>{rotulo}</Txt>
                </Pressable>
              ))}
            </View>
            <LineChart values={pontos.map((p) => p[metrica])} label={`Gráfico de ${nome}`} />
            <Txt v="sub" style={{ fontSize: 12 }}>
              {pontos.length === 1 ? 'Faça mais treinos para ver a linha.' : `De ${new Date(pontos[0].t).toLocaleDateString('pt-BR')} até hoje, em kg.`}
            </Txt>
          </Card>
        ) : (
          <Card>
            <Txt v="sub">O gráfico aparece para exercícios com carga. Abaixo estão todas as vezes que você fez este.</Txt>
          </Card>
        )}

        <Txt v="label" style={{ marginTop: 4 }}>Todas as vezes</Txt>
        {vezes.map(({ s: sessao, e }, i) => (
          <View key={`${sessao.id}-${i}`} style={s.item}>
            <Txt v="label" style={{ color: colors.text }}>
              {new Date(sessao.startedAt).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')}
            </Txt>
            <Txt v="sub">{e.sets.filter((x) => x.done).map((x) => formatSet(x, medidaDe(e))).join(' · ')}</Txt>
            {e.note ? <Txt v="sub" style={{ fontStyle: 'italic', color: colors.faint }}>{e.note}</Txt> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  strong: { fontFamily: fonts.display, fontSize: 20, color: colors.accent },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.raised, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.accent },
  chipText: { fontFamily: fonts.semibold, fontSize: 13 },
  item: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, gap: 2 },
});
