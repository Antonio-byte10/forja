import * as Linking from 'expo-linking';
import { modalidadesLuta } from '@/data/catalog';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ExerciseImage, NumberInput, Opcoes, ScreenHeader, Txt } from '@/components/ui';
import { voltar } from '@/lib/navegacao';
import type { Intensidade } from '@/lib/types';
import { newActivity, pace } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, fonts, radius } from '@/theme';

const ATIVIDADES = ['Corrida', 'Caminhada', 'Bicicleta', 'Natação', 'Futebol', 'Treino em casa', 'Luta', 'Dança', 'Yoga', 'Trilha'];
const INTENSIDADES: Intensidade[] = ['leve', 'moderada', 'forte'];
const DIAS = ['Hoje', 'Ontem', 'Anteontem', 'Há 3 dias', 'Há 4 dias', 'Há 5 dias', 'Há 6 dias'];

/** Registro avulso: corrida, futebol, treino em casa sem ficha… Só duração é obrigatória. */
export default function Atividade() {
  const addSession = useStore((st) => st.addSession);
  const { bottom } = useSafeAreaInsets();
  const [nome, setNome] = useState('Corrida');
  const [modalidade, setModalidade] = useState('');
  const luta = modalidadesLuta.find(([key]) => key === modalidade);
  const [outro, setOutro] = useState('');
  const [minutos, setMinutos] = useState(30);
  const [km, setKm] = useState(0);
  const [intensidade, setIntensidade] = useState<Intensidade>('moderada');
  const [dia, setDia] = useState(0);
  const [nota, setNota] = useState('');

  const titulo = nome === 'Outra' ? outro.trim() : nome === 'Luta' ? luta?.[1].name ?? 'Luta' : nome;
  const ritmo = pace(minutos, km * 1000);

  const salvar = () => {
    // Hoje: terminou agora. Dias anteriores: fica no mesmo horário daquele dia.
    const fim = Date.now() - dia * 86_400_000;
    addSession(newActivity({ nome: titulo, inicio: fim - minutos * 60_000, minutos, metros: nome === 'Luta' ? undefined : Math.round(km * 1000), intensidade, nota }));
    voltar();
  };

  return (
    <View style={s.screen}>
      <ScreenHeader kicker="Fora da ficha" title="Registrar atividade" right={<Button small label="Salvar" onPress={salvar} disabled={!titulo || minutos <= 0} />} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={[s.content, { paddingBottom: bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <Txt v="label">O que você fez</Txt>
        <Opcoes sobreFundo grande label="Atividade" value={nome} onChange={setNome} options={[...ATIVIDADES, 'Outra'].map((a) => [a, a] as const)} />
        {nome === 'Luta' && <>
          <Txt v="label">Modalidade</Txt>
          <Opcoes sobreFundo grande label="Modalidade de luta" value={modalidade} onChange={setModalidade}
            options={modalidadesLuta.map(([key, item]) => [key, item.name] as const)} />
          {luta && <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <ExerciseImage catalogKey={luta[0]} name={luta[1].name} size={60} />
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL('https://github.com/Antonio-byte10/forja/blob/main/assets/exercises/CREDITOS-LUTAS.md')}>
              <Txt v="sub">Créditos das fotos</Txt>
            </Pressable>
          </View>}
        </>}
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
          {nome !== 'Luta' && <View style={s.field}>
            <Txt v="label">Distância (km)</Txt>
            <NumberInput label="Distância em quilômetros" value={km} onChange={setKm} style={s.number} />
          </View>}
        </View>
        {nome !== 'Luta' && <Txt v="sub">{ritmo ? `Ritmo: ${ritmo} min/km` : 'A distância é opcional. Com ela, o app calcula o ritmo.'}</Txt>}

        <Txt v="label" style={s.gap}>Intensidade</Txt>
        <Opcoes sobreFundo grande label="Intensidade" value={intensidade} onChange={setIntensidade} options={INTENSIDADES.map((i) => [i, i[0].toUpperCase() + i.slice(1)] as const)} />

        <Txt v="label" style={s.gap}>Quando</Txt>
        <Opcoes sobreFundo grande label="Dia" value={dia} onChange={setDia} options={DIAS.map((d, i) => [i, d] as const)} />

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
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, gap: 10 },
  gap: { marginTop: 12 },
  numbers: { flexDirection: 'row', gap: 12, marginTop: 12 },
  field: { flex: 1, gap: 6 },
  number: { height: 56, fontSize: 28 },
  input: {
    backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, minHeight: 52, paddingHorizontal: 14,
    fontFamily: fonts.medium, fontSize: 16, borderWidth: 1, borderColor: colors.line,
  },
  nota: { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },
});
