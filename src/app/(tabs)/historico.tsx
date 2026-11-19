import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/Icon';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Button, Card, Txt } from '@/components/ui';
import { confirm } from '@/lib/platform';
import type { Session } from '@/lib/types';
import {
  countSets, dayKey, exerciseKey, exerciseVolume, formatKg, formatKm, medidaDe, pace, resumo, sessionMeters, sessionMinutes, summarizeSets, volumeChanges,
} from '@/lib/workout';
import { useStore } from '@/store';
import { colors, fonts, radius } from '@/theme';

const titulo = (s: Session) =>
  s.tipo === 'atividade' || s.tipo === 'livre' ? s.planTitle || 'Atividade' : `Ficha ${s.planName}${s.planTitle ? ` · ${s.planTitle}` : ''}`;
const icone = (s: Session): IconName => (s.tipo === 'atividade' ? 'timer' : s.lugar === 'casa' || s.tipo === 'livre' ? 'home' : 'dumbbell');

/** Linha de detalhe embaixo do título: duração e o que mais fizer sentido para o tipo. */
function detalhe(s: Session) {
  const min = sessionMinutes(s);
  const partes = [`${min} min`];
  if (s.tipo === 'atividade') {
    const ritmo = pace(min, sessionMeters(s));
    if (ritmo) partes.push(`${ritmo} min/km`);
    if (s.intensidade) partes.push(s.intensidade);
  } else {
    const { done } = countSets(s);
    partes.push(`${done} ${done === 1 ? 'série' : 'séries'}`);
  }
  return partes.join(' · ');
}

export default function Historico() {
  const history = useStore((st) => st.history);
  const deleteSession = useStore((st) => st.deleteSession);
  const [open, setOpen] = useState<string>();
  const { top } = useSafeAreaInsets();
  const changes = useMemo(() => volumeChanges(history), [history]);
  // Quantas sessões e minutos cada dia teve, para o cabeçalho do dia.
  const dias = useMemo(() => {
    const m = new Map<string, { n: number; min: number }>();
    for (const s of history) {
      const d = m.get(dayKey(s.startedAt)) ?? { n: 0, min: 0 };
      m.set(dayKey(s.startedAt), { n: d.n + 1, min: d.min + sessionMinutes(s) });
    }
    return m;
  }, [history]);

  return (
    <FlatList
      style={s.screen}
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[s.list, { paddingTop: top + 16 }]}
      ListHeaderComponent={
        <View style={s.header}>
          <Txt v="hero">Histórico</Txt>
          <MonthCalendar history={history} />
        </View>
      }
      ListEmptyComponent={
        <Card style={s.empty}>
          <Icon name="calendar" size={28} color={colors.faint} />
          <Txt v="h2">Nada por aqui ainda</Txt>
          <Txt v="sub" style={{ textAlign: 'center' }}>Treinos de ficha, treinos livres e atividades (corrida, futebol…) aparecem aqui, dia a dia.</Txt>
        </Card>
      }
      renderItem={({ item, index }) => {
        const change = changes.get(item.id);
        const date = new Date(item.startedAt);
        const isOpen = open === item.id;
        const { valor, unidade } = resumo(item);
        const primeiroDoDia = index === 0 || dayKey(history[index - 1].startedAt) !== dayKey(item.startedAt);
        const dia = dias.get(dayKey(item.startedAt));
        const remove = async () => {
          if (await confirm('Apagar este registro?', 'Não dá para desfazer.', 'Apagar')) deleteSession(item.id);
        };
        return (
          <View style={s.item}>
            {primeiroDoDia && (
              <View style={s.dayHead}>
                <Txt v="label" style={{ color: colors.text }}>
                  {date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')}
                </Txt>
                {dia && dia.n > 1 && <Txt v="label">{dia.n} treinos · {dia.min} min</Txt>}
              </View>
            )}
            <View style={s.card}>
              <Pressable
                onPress={() => setOpen(isOpen ? undefined : item.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                style={({ pressed }) => [s.summary, pressed && s.pressed]}
              >
                <View style={s.badge}>
                  <Icon name={icone(item)} size={22} color={colors.accent} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt v="h2" numberOfLines={1}>{titulo(item)}</Txt>
                  <Txt v="sub" numberOfLines={1}>
                    {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {detalhe(item)}
                  </Txt>
                </View>
                <View style={s.right}>
                  <Txt style={s.volume}>{valor}<Txt v="sub"> {unidade}</Txt></Txt>
                  {change !== undefined && (
                    <View style={s.trend}>
                      <Icon name={change >= 0 ? 'trendUp' : 'trendDown'} size={13} color={change >= 0 ? colors.up : colors.danger} />
                      <Txt style={[s.trendText, { color: change >= 0 ? colors.up : colors.danger }]}>{Math.abs(change)}%</Txt>
                    </View>
                  )}
                </View>
              </Pressable>
              {isOpen && (
                <View style={s.details}>
                  {item.tipo === 'atividade' && (
                    <View style={s.exercise}>
                      {sessionMeters(item) > 0 && <Txt>{formatKm(sessionMeters(item))} km em {sessionMinutes(item)} min</Txt>}
                      {item.nota ? <Txt v="sub">{item.nota}</Txt> : sessionMeters(item) === 0 && <Txt v="sub">Sem anotação.</Txt>}
                    </View>
                  )}
                  {item.exercises.map((ex, i) => {
                    const done = ex.sets.filter((x) => x.done);
                    if (!done.length) return null;
                    const medida = medidaDe(ex);
                    return (
                      <Pressable
                        key={i}
                        onPress={() => router.push({ pathname: '/exercicio/[key]', params: { key: exerciseKey(ex) } })}
                        accessibilityRole="button"
                        accessibilityLabel={`Evolução de ${ex.name}`}
                        style={({ pressed }) => [s.exercise, pressed && s.pressed]}
                      >
                        <View style={s.exRow}>
                          <Txt style={s.exName} numberOfLines={1}>{ex.name}</Txt>
                          {medida === 'carga' && <Txt v="sub">{formatKg(exerciseVolume(ex))} kg</Txt>}
                        </View>
                        <Txt v="sub">{summarizeSets(done, medida)}{medida === 'carga' && ex.unilateral ? ' (por lado)' : ''}</Txt>
                        {ex.note?.trim() ? <Txt v="sub" style={s.exNote}>{ex.note.trim()}</Txt> : null}
                      </Pressable>
                    );
                  })}
                  <View style={s.actions}>
                    {item.tipo !== 'atividade' && (
                      <Button
                        small
                        variant="secondary"
                        icon="pencil"
                        label="Editar"
                        onPress={() => router.push({ pathname: '/editar/[id]', params: { id: item.id } })}
                      />
                    )}
                    <Button small variant="danger" icon="trash" label="Apagar" onPress={remove} />
                  </View>
                </View>
              )}
            </View>
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  header: { gap: 16, marginBottom: 2 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 28 },
  item: { gap: 8 },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingHorizontal: 2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  pressed: { opacity: 0.7 },
  badge: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  right: { alignItems: 'flex-end', gap: 2 },
  volume: { fontFamily: fonts.display, fontSize: 20, color: colors.text },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendText: { fontFamily: fonts.semibold, fontSize: 12 },
  details: { borderTopWidth: 1, borderColor: colors.line, padding: 14, gap: 12 },
  exercise: { gap: 2 },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  exName: { fontFamily: fonts.semibold, flexShrink: 1 },
  exNote: { color: colors.faint, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
