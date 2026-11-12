import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, NumberInput, ScreenHeader, Txt } from '@/components/ui';
import type { Intensidade } from '@/lib/types';
import { newActivity, pace } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, fonts, radius } from '@/theme';

const ATIVIDADES = ['Corrida', 'Caminhada', 'Bicicleta', 'Natação', 'Futebol', 'Treino em casa', 'Luta', 'Dança', 'Yoga', 'Trilha'];
const INTENSIDADES: Intensidade[] = ['leve', 'moderada', 'forte'];
const DIAS = ['Hoje', 'Ontem', 'Anteontem', 'Há 3 dias', 'Há 4 dias', 'Há 5 dias', 'Há 6 dias'];

function Chips<T extends string | number>({ options, value, onChange, label }: {
  options: readonly { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <View style={s.chips} accessibilityLabel={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={({ pressed }) => [s.chip, on && s.chipOn, pressed && { opacity: 0.7 }]}
          >
            <Txt style={[s.chipText, on && { color: colors.onAccent }]}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Registro avulso: corrida, futebol, treino em casa sem ficha… Só duração é obrigatória. */
export default function Atividade() {
  const addSession = useStore((st) => st.addSession);
  const { bottom } = useSafeAreaInsets();
  const [nome, setNome] = useState('Corrida');
  const [outro, setOutro] = useState('');
  const [minutos, setMinutos] = useState(30);
  const [km, setKm] = useState(0);
  const [intensidade, setIntensidade] = useState<Intensidade>('moderada');
  const [dia, setDia] = useState(0);
  const [nota, setNota] = useState('');

  const titulo = nome === 'Outra' ? outro.trim() : nome;
  const ritmo = pace(minutos, km * 1000);

  const salvar = () => {
    // Hoje: terminou agora. Dias anteriores: fica no mesmo horário daquele dia.
    const fim = Date.now() - dia * 86_400_000;
    addSession(newActivity({ nome: titulo, inicio: fim - minutos * 60_000, minutos, metros: Math.round(km * 1000), intensidade, nota }));
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={s.screen}>
      <ScreenHeader kicker="Fora da ficha" title="Registrar atividade" right={<Button small label="Salvar" onPress={salvar} disabled={!titulo || minutos <= 0} />} />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <Txt v="label">O que você fez</Txt>
        <Chips label="Atividade" value={nome} onChange={setNome} options={[...ATIVIDADES, 'Outra'].map((a) => ({ value: a, label: a }))} />
        {nome === 'Outra' && (
          <TextInput
            value={outro}
            onChangeText={setOutro}
            placeholder="Nome da atividade"
            placeholderTextColor={colors.faint}
            accessibilityLabel="Nome da atividade"
            style={s.input}
          />
        )}

        <View style={s.numbers}>
          <View style={s.field}>
            <Txt v="label">Duração (min)</Txt>
            <NumberInput integer label="Duração em minutos" value={minutos} onChange={setMinutos} style={s.number} />
          </View>
          <View style={s.field}>
            <Txt v="label">Distância (km)</Txt>
            <NumberInput label="Distância em quilômetros" value={km} onChange={setKm} style={s.number} />
          </View>
        </View>
        <Txt v="sub">{ritmo ? `Ritmo: ${ritmo} min/km` : 'A distância é opcional. Com ela, o app calcula o ritmo.'}</Txt>

        <Txt v="label" style={s.gap}>Intensidade</Txt>
        <Chips label="Intensidade" value={intensidade} onChange={setIntensidade} options={INTENSIDADES.map((i) => ({ value: i, label: i[0].toUpperCase() + i.slice(1) }))} />

        <Txt v="label" style={s.gap}>Quando</Txt>
        <Chips label="Dia" value={dia} onChange={setDia} options={DIAS.map((d, i) => ({ value: i, label: d }))} />

        <Txt v="label" style={s.gap}>Anotação (opcional)</Txt>
        <TextInput
          value={nota}
          onChangeText={setNota}
          multiline
          placeholder="Ex.: percurso do parque, 3 partidas…"
          placeholderTextColor={colors.faint}
          accessibilityLabel="Anotação"
          style={[s.input, s.nota]}
        />
        <Button label="Salvar no histórico" icon="check" onPress={salvar} disabled={!titulo || minutos <= 0} style={s.gap} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, gap: 10 },
  gap: { marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 40, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.surface, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.accent },
  chipText: { fontFamily: fonts.semibold, fontSize: 14 },
  numbers: { flexDirection: 'row', gap: 12, marginTop: 12 },
  field: { flex: 1, gap: 6 },
  number: { height: 56, fontSize: 28 },
  input: {
    backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, minHeight: 52, paddingHorizontal: 14,
    fontFamily: fonts.medium, fontSize: 16, borderWidth: 1, borderColor: colors.line,
  },
  nota: { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },
});
