import { useState } from 'react';
import { View } from 'react-native';
import { useStore } from '@/store';
import type { Refeicao } from '@/lib/nutricao';
import { Campo } from './Campo';
import { Button, Txt } from './ui';

export function Alternativa({ dia, refeicao, valor }: { dia: string; refeicao: Refeicao; valor?: string }) {
  const [aberta, abrir] = useState(false);
  const [texto, escrever] = useState('');
  const salvar = (opcao: string) => {
    useStore.getState().escolherAlternativa(dia, refeicao.id, opcao.trim());
    abrir(false);
  };
  return <View style={{ gap: 6 }}>
    {!!valor && <Txt v="sub">Consumido: {valor}</Txt>}
    {aberta ? <>
      {refeicao.alternativas?.filter((opcao) => opcao.trim()).map((opcao, i) => <Button small variant="secondary" key={i} label={opcao} onPress={() => salvar(opcao)} />)}
      <Campo label="O que consumi" value={texto} onChangeText={escrever} multiline maxLength={1000} />
      <Button small label={texto.trim() ? 'Salvar escolha' : 'Limpar escolha'} onPress={() => salvar(texto)} />
      <Button small variant="ghost" label="Cancelar" onPress={() => abrir(false)} />
    </> : <Button small variant="ghost" label={valor ? 'Alterar escolha' : 'Registrar o que consumi'} onPress={() => { escrever(valor ?? ''); abrir(true); }} />}
  </View>;
}
