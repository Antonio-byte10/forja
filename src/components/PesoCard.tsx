import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { confirm } from '@/lib/platform';
import { dayKey, formatKg } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, fonts } from '@/theme';
import { Icon } from './Icon';
import { LineChart } from './LineChart';
import { Button, Card, IconButton, NumberInput, Txt } from './ui';

const DIA = 86_400_000;

/** Peso corporal: registro do dia, variação em 30 dias e gráfico. */
export function PesoCard() {
  const pesos = useStore((st) => st.pesos);
  const [agora] = useState(Date.now);
  const ultimo = pesos.at(-1);
  const [kg, setKg] = useState(ultimo?.kg ?? 0);
  const [lista, setLista] = useState(false);
  const hojeFeito = ultimo && dayKey(ultimo.t) === dayKey(agora);
  // Comparação com o registro mais próximo de 30 dias atrás (ou o primeiro, se ainda não tem 30 dias).
  const base = pesos.filter((p) => p.t <= agora - 30 * DIA).at(-1) ?? (pesos.length > 1 ? pesos[0] : undefined);
  const diff = ultimo && base && base !== ultimo ? Math.round((ultimo.kg - base.kg) * 10) / 10 : undefined;
  const recentes = pesos.slice(-30);

  const salvar = () => {
    if (kg > 0) useStore.getState().addPeso({ t: Date.now(), kg });
  };
  const apagar = async (t: number) => {
    if (await confirm('Apagar este registro de peso?', '', 'Apagar')) useStore.getState().deletePeso(t);
  };

  return (
    <Card style={s.card}>
      <View style={s.row}>
        <View style={s.icon}><Icon name="scale" size={20} color={colors.accent} /></View>
        <View style={{ flex: 1 }}>
          <Txt v="label">Peso corporal</Txt>
          <Txt style={s.big}>{ultimo ? `${formatKg(ultimo.kg)} kg` : '—'}</Txt>
        </View>
        {diff !== undefined && (
          <View style={{ alignItems: 'flex-end' }}>
            <Txt style={[s.diff, { color: diff === 0 ? colors.sub : colors.text }]}>{diff > 0 ? '+' : ''}{formatKg(diff)} kg</Txt>
            <Txt v="label">{base && agora - base.t >= 30 * DIA ? 'em 30 dias' : 'desde o início'}</Txt>
          </View>
        )}
      </View>
      {recentes.length >= 2 && <LineChart values={recentes.map((p) => p.kg)} height={120} label="Gráfico do peso corporal" />}
      <View style={s.row}>
        <Txt v="sub" style={{ flex: 1 }}>{hojeFeito ? 'Corrigir o peso de hoje' : 'Peso de hoje (kg)'}</Txt>
        <NumberInput label="Peso de hoje em kg" value={kg} onChange={setKg} style={s.input} />
        <Button small label="Salvar" onPress={salvar} disabled={kg <= 0} />
      </View>
      {pesos.length > 0 && (
        <Pressable onPress={() => setLista((v) => !v)} accessibilityRole="button" hitSlop={8}>
          <Txt v="label" style={{ color: colors.accent }}>{lista ? 'Esconder registros' : `Ver registros (${pesos.length})`}</Txt>
        </Pressable>
      )}
      {lista &&
        [...pesos].reverse().map((p) => (
          <View key={p.t} style={s.row}>
            <Txt v="sub" style={{ flex: 1 }}>{new Date(p.t).toLocaleDateString('pt-BR')}</Txt>
            <Txt style={{ fontFamily: fonts.semibold }}>{formatKg(p.kg)} kg</Txt>
            <IconButton icon="trash" label="Apagar registro" color={colors.danger} onPress={() => apagar(p.t)} size={36} />
          </View>
        ))}
    </Card>
  );
}

const s = StyleSheet.create({
  card: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  big: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.text },
  diff: { fontFamily: fonts.display, fontSize: 18 },
  input: { width: 84, height: 40, fontSize: 18 },
});
