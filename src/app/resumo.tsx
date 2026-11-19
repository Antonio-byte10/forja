import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FotosDoTreino } from '@/components/Fotos';
import { Icon } from '@/components/Icon';
import { Button, Card, ExerciseImage, Txt } from '@/components/ui';
import {
  countSets, formatKg, formatSeconds, medidaDe, recordesDaSessao, sessionMinutes, sessionReps, sessionSeconds, sessionVolume,
  summarizeSets, volumeChange,
} from '@/lib/workout';
import { useStore } from '@/store';
import { colors, fonts, radius } from '@/theme';

/** Tela que aparece ao finalizar: o que foi feito, recordes e comparação com a última vez. */
export default function Resumo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const history = useStore((st) => st.history);
  const { top, bottom } = useSafeAreaInsets();
  const session = history.find((s) => s.id === id);
  if (!session) return <Redirect href="/" />;

  const { done } = countSets(session);
  const kg = sessionVolume(session);
  const reps = sessionReps(session);
  const seg = sessionSeconds(session);
  const change = volumeChange(history, session);
  const recordes = recordesDaSessao(history, session);
  const numeros: [string, string][] = [
    ['Duração', `${sessionMinutes(session)} min`],
    ['Séries', String(done)],
    kg > 0 ? ['Volume', `${formatKg(kg)} kg`] : reps > 0 ? ['Repetições', String(reps)] : ['Tempo feito', formatSeconds(seg)],
  ];

  return (
    <ScrollView style={s.screen} contentContainerStyle={[s.content, { paddingTop: top + 24, paddingBottom: bottom + 32 }]}>
      <View style={s.head}>
        <View style={s.check}>
          <Icon name="check" size={34} color={colors.onAccent} stroke={3} />
        </View>
        <Txt v="label" style={{ color: colors.accent }}>Treino salvo</Txt>
        <Txt v="hero" style={{ textAlign: 'center' }}>{session.planTitle || `Ficha ${session.planName}`}</Txt>
      </View>

      <Card style={s.stats}>
        {numeros.map(([rotulo, valor]) => (
          <View key={rotulo} style={s.stat}>
            <Txt v="label">{rotulo}</Txt>
            <Txt v="num">{valor}</Txt>
          </View>
        ))}
      </Card>

      {change !== undefined && (
        <Card style={s.row}>
          <Icon name={change >= 0 ? 'trendUp' : 'trendDown'} size={22} color={change >= 0 ? colors.up : colors.danger} />
          <Txt style={{ flex: 1 }}>
            {change === 0 ? 'Mesmo volume' : `${Math.abs(change)}% ${change > 0 ? 'mais' : 'menos'} volume`} que o último treino desta ficha.
          </Txt>
        </Card>
      )}

      {recordes.length > 0 && (
        <Card style={s.records}>
          <View style={s.row}>
            <Icon name="trophy" size={22} color={colors.up} />
            <Txt v="h2">{recordes.length === 1 ? 'Recorde batido!' : `${recordes.length} recordes batidos!`}</Txt>
          </View>
          {recordes.map((r) => (
            <View key={r.name} style={s.recordRow}>
              <Txt style={{ flex: 1 }} numberOfLines={1}>{r.name}</Txt>
              <Txt v="sub">{formatKg(r.antes)} → </Txt>
              <Txt style={{ fontFamily: fonts.semibold, color: colors.up }}>{formatKg(r.agora)} kg</Txt>
            </View>
          ))}
        </Card>
      )}

      <Txt v="label" style={{ marginTop: 4 }}>O que você fez</Txt>
      {session.exercises.map((ex, i) => {
        const feitas = ex.sets.filter((x) => x.done);
        if (!feitas.length) return null;
        return (
          <View key={i} style={s.exercise}>
            <ExerciseImage catalogKey={ex.catalogKey} name={ex.name} size={32} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontFamily: fonts.semibold }} numberOfLines={1}>{ex.name}</Txt>
              <Txt v="sub" numberOfLines={2}>{summarizeSets(feitas, medidaDe(ex))}</Txt>
            </View>
          </View>
        );
      })}

      <Card>
        <FotosDoTreino sessionId={session.id} t={session.startedAt} />
      </Card>

      <Button label="Voltar ao início" icon="home" onPress={() => router.replace('/')} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, gap: 12 },
  head: { alignItems: 'center', gap: 8, marginBottom: 8 },
  check: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, gap: 2, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  records: { gap: 10, borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.35)' },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exercise: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12 },
});
