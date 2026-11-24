import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Campo } from '@/components/Campo';
import { Button, Card, ScreenHeader, Txt } from '@/components/ui';
import { voltar } from '@/lib/navegacao';
import { configIa, enderecoValido, LOCAL, PRAZO_IA, testarServico } from '@/lib/servicoIa';
import { useStore } from '@/store';
import { colors } from '@/theme';

/** Onde o app encontra o servidor de IA (Render ou `npm run ia`). Fica só neste aparelho. */
export default function ServidorIa() {
  const { bottom } = useSafeAreaInsets();
  const [endereco, setEndereco] = useState(() => configIa().endereco);
  const [codigo, setCodigo] = useState(() => configIa().codigo);
  const [aviso, setAviso] = useState('');
  const [testando, setTestando] = useState(false);
  const pedido = useRef<AbortController | null>(null);
  useEffect(() => () => pedido.current?.abort(), []);

  const limpo = endereco.trim().replace(/\/+$/, '');
  const valido = enderecoValido(limpo);

  async function testar() {
    if (pedido.current) return;
    const controle = new AbortController();
    pedido.current = controle;
    const prazo = setTimeout(() => controle.abort(), PRAZO_IA);
    setTestando(true);
    setAviso('Testando… No Render gratuito, a primeira resposta pode levar até 1 minuto.');
    const resultado = await testarServico({ endereco: limpo, codigo: codigo.trim() }, controle.signal);
    clearTimeout(prazo);
    if (pedido.current === controle) { pedido.current = null; setAviso(resultado); setTestando(false); }
  }

  function salvar() {
    useStore.getState().setAjustes({ servidorIa: limpo, codigoIa: codigo.trim() });
    voltar('/progresso');
  }

  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScreenHeader kicker="Gemini" title="Servidor de IA" />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: bottom + 24, gap: 14 }}>
      <Txt v="sub">A importação do plano alimentar e a mensagem motivacional usam um servidor seu, com a sua chave do Gemini. O app funciona normalmente sem ele.</Txt>
      <Card style={{ gap: 12 }}>
        <Campo label="Endereço do servidor" value={endereco} onChangeText={setEndereco} placeholder="https://forja-ia.onrender.com"
          autoCapitalize="none" autoCorrect={false} keyboardType="url" />
        <Campo label="Código de acesso (FORJA_TOKEN)" value={codigo} onChangeText={setCodigo} placeholder="Copie do painel do Render"
          autoCapitalize="none" autoCorrect={false} secureTextEntry />
        {!valido && !!limpo && <Txt v="sub" style={{ color: colors.danger }}>Use um endereço https://. Sem criptografia, só {LOCAL}.</Txt>}
        <Button variant="secondary" label={testando ? 'Testando…' : 'Testar conexão'} disabled={!valido || testando} onPress={testar} />
        {!!aviso && <Txt accessibilityLiveRegion="polite">{aviso}</Txt>}
      </Card>
      <Button label="Salvar" disabled={!valido} onPress={salvar} />
      <Txt v="sub">O endereço e o código ficam só neste aparelho e não entram no backup. Para criar o servidor, veja a seção «Servidor de IA no Render» do README.</Txt>
    </ScrollView>
  </KeyboardAvoidingView>;
}
