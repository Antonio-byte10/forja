import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Campo } from '@/components/Campo';
import { Button, Card, ScreenHeader, Txt } from '@/components/ui';
import { confirm } from '@/lib/platform';
import { voltar } from '@/lib/navegacao';
import { niveis, perfilValido, type Perfil } from '@/lib/semana';
import { parseNumber } from '@/lib/workout';
import { useStore } from '@/store';
import { colors } from '@/theme';

export default function PerfilEnergetico() {
  const perfil = useStore((s) => s.perfil);
  const [peso, setPeso] = useState(() => String(perfil?.peso ?? useStore.getState().pesos.at(-1)?.kg ?? ''));
  const [altura, setAltura] = useState(() => {
    const diario = useStore.getState().nutricao.diario;
    const ultima = Object.keys(diario).sort().reverse().find((d) => diario[d].altura);
    return String(perfil?.altura ?? (ultima && diario[ultima].altura) ?? '');
  });
  const [idade, setIdade] = useState(String(perfil?.idade ?? ''));
  const [sexo, setSexo] = useState(perfil?.sexo);
  const [atividade, setAtividade] = useState(perfil?.atividade);
  const [erro, setErro] = useState('');
  const { bottom } = useSafeAreaInsets();

  function salvar() {
    const dados = { peso: parseNumber(peso), altura: parseNumber(altura), idade: parseNumber(idade), sexo, atividade };
    if (!perfilValido(dados)) {
      setErro('Confira idade (19 a 120 anos), peso (20 a menos de 500 kg), altura (80 a 250 cm), sexo e atividade.');
      return;
    }
    useStore.getState().salvarPerfil(dados);
    voltar('/progresso');
  }
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScreenHeader title="Perfil energético" />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: bottom + 24, gap: 14 }}>
      <Txt v="sub">Use as medidas atuais para estimar seu gasto em um dia típico. A estimativa é destinada a adultos a partir de 19 anos, fora da gestação e da amamentação.</Txt>
      <Card style={{ gap: 12 }}>
        <Campo label="Idade (anos)" value={idade} onChangeText={setIdade} keyboardType="number-pad" maxLength={3} />
        <Campo label="Peso do perfil (kg)" value={peso} onChangeText={setPeso} keyboardType="decimal-pad" maxLength={6} />
        <Campo label="Altura do perfil (cm)" value={altura} onChangeText={setAltura} keyboardType="decimal-pad" maxLength={6} />
        <Txt v="label">Sexo usado na equação</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(['Feminino', 'Masculino'] as const).map((s) =>
          <Opcao key={s} label={s} ativa={s === sexo} escolher={() => setSexo(s)} />)}</View>
        <Txt v="label">Atividade física habitual</Txt>
        <Txt v="sub">Considere trabalho, deslocamentos e exercícios ao longo da semana.</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{niveis.map((n) =>
          <Opcao key={n} label={n} ativa={atividade === n} escolher={() => setAtividade(n)} />)}</View>
      </Card>
      {!!erro && <Txt accessibilityLiveRegion="polite" style={{ color: colors.danger }}>{erro}</Txt>}
      <Button label="Salvar perfil" onPress={salvar} />
      {perfil && <Button variant="ghost" label="Apagar perfil" onPress={async () => {
        if (await confirm('Apagar perfil energético?', 'As medidas registradas no diário ficam disponíveis.', 'Apagar')) {
          useStore.getState().salvarPerfil(null);
          voltar('/progresso');
        }
      }} />}
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Opcao({ label, ativa, escolher }: { label: Perfil['sexo'] | Perfil['atividade']; ativa: boolean; escolher: () => void }) {
  return <Button label={label} selected={ativa} small variant={ativa ? 'primary' : 'secondary'} onPress={escolher} />;
}
