import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { abrirAjustesPassos, estadoPassos, passosPorDia, pedirPermissaoPassos, type EstadoPassos } from '@/lib/passos';
import { useStore } from '@/store';
import { colors, fonts } from '@/theme';
import { Icon } from './Icon';
import { Button, Card, IconButton, ProgressBar, Txt } from './ui';

const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const fmt = (n: number) => n.toLocaleString('pt-BR');

/** Passos de hoje e dos últimos 7 dias, lidos do Health Connect. Some no navegador e em aparelhos sem suporte. */
export function PassosCard() {
  const meta = useStore((st) => st.ajustes.metaPassos);
  const [estado, setEstado] = useState<EstadoPassos>();
  const [dias, setDias] = useState<{ dia: number; passos: number }[]>([]);
  const [editando, setEditando] = useState(false);

  const carregar = useCallback(async () => {
    const e = await estadoPassos();
    setEstado(e);
    if (e === 'ok') setDias(await passosPorDia(7));
  }, []);

  // Atualiza toda vez que a tela volta a aparecer (os passos mudam ao longo do dia).
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  if (!estado || estado === 'indisponivel') return null;

  if (estado !== 'ok') {
    const semApp = estado === 'sem-app';
    return (
      <Card style={s.card}>
        <View style={s.row}>
          <View style={s.icon}><Icon name="footprints" size={20} color={colors.accent} /></View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="h2">Passos do dia</Txt>
            <Txt v="sub">
              {semApp
                ? 'Atualize o Health Connect na Play Store para o Forja ler seus passos.'
                : 'O Forja só lê os passos que o celular já conta (Health Connect). Nada sai do aparelho.'}
            </Txt>
          </View>
        </View>
        <Button
          small
          variant="secondary"
          label={semApp ? 'Abrir Health Connect' : 'Ver meus passos'}
          onPress={async () => {
            if (semApp) abrirAjustesPassos();
            else if (await pedirPermissaoPassos()) {
              useStore.getState().setAjustes({ passos: true });
              carregar();
            }
          }}
        />
      </Card>
    );
  }

  const hoje = dias.at(-1)?.passos ?? 0;
  const maior = Math.max(meta, ...dias.map((d) => d.passos));
  const mudarMeta = (n: number) => useStore.getState().setAjustes({ metaPassos: Math.min(30000, Math.max(1000, n)) });

  return (
    <Card style={s.card}>
      <View style={s.row}>
        <View style={s.icon}><Icon name="footprints" size={20} color={colors.accent} /></View>
        <View style={{ flex: 1 }}>
          <Txt v="label">Passos hoje</Txt>
          <Txt style={s.big}>{fmt(hoje)}</Txt>
        </View>
        <Pressable onPress={() => setEditando((v) => !v)} accessibilityRole="button" accessibilityLabel={`Meta de ${fmt(meta)} passos. Toque para mudar.`} hitSlop={8}>
          <Txt v="label" style={{ color: hoje >= meta ? colors.up : colors.faint }}>meta {fmt(meta)}</Txt>
        </Pressable>
      </View>
      <ProgressBar value={hoje / meta} />
      {editando && (
        <View style={s.row}>
          <Txt v="sub" style={{ flex: 1 }}>Meta de passos por dia</Txt>
          <IconButton icon="minus" label="Diminuir meta de passos" onPress={() => mudarMeta(meta - 1000)} size={36} filled />
          <Txt v="num" style={{ minWidth: 64, textAlign: 'center' }}>{fmt(meta)}</Txt>
          <IconButton icon="plus" label="Aumentar meta de passos" onPress={() => mudarMeta(meta + 1000)} size={36} filled />
        </View>
      )}
      <View style={s.bars} accessibilityLabel={`Últimos 7 dias: ${dias.map((d) => fmt(d.passos)).join(', ')} passos`}>
        {dias.map((d, i) => {
          const bateu = d.passos >= meta;
          const ehHoje = i === dias.length - 1;
          return (
            <View key={d.dia} style={s.barCol}>
              <View style={s.barTrack}>
                <View style={[s.bar, { height: `${Math.max(4, (d.passos / maior) * 100)}%`, backgroundColor: bateu ? colors.up : ehHoje ? colors.accent : colors.raised }]} />
              </View>
              <Txt v="label" style={[s.barLabel, ehHoje && { color: colors.text }]}>{LETRAS[new Date(d.dia).getDay()]}</Txt>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  card: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  big: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.text },
  bars: { flexDirection: 'row', gap: 8, height: 70 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 11 },
});
