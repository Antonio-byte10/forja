import { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Campo } from '@/components/Campo';
import { Button, Card, ScreenHeader, Txt } from '@/components/ui';
import { br, htmlConsulta, lerDataBR, resumoConsulta } from '@/lib/consulta';
import { exportarConsulta, imagemParaRelatorio } from '@/lib/exportarConsulta';
import { useStore } from '@/store';
import { colors } from '@/theme';
import { dataLocal, dataValida } from '@/lib/datas';

export default function Consulta() {
  const [hoje] = useState(() => new Date());
  const [de, setDe] = useState(() => br(dataLocal(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 29))));
  const [ate, setAte] = useState(br(dataLocal(hoje)));
  const [notas, setNotas] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState('');
  const nutricao = useStore((s) => s.nutricao);
  const pesos = useStore((s) => s.pesos);
  const fotos = useStore((s) => s.fotos);
  const inicio = lerDataBR(de), fim = lerDataBR(ate);
  const valido = dataValida(inicio) && dataValida(fim) && inicio <= fim && fim <= dataLocal(hoje);
  const resumo = resumoConsulta(inicio, fim, nutricao, pesos, notas);
  const disponiveis = valido ? fotos.filter((f) => inicio <= dataLocal(f.t) && dataLocal(f.t) <= fim) : [];
  const selecionadas = disponiveis.filter((f) => ids.includes(f.id));
  const { bottom } = useSafeAreaInsets();
  const exportar = async () => {
    setOcupado(true); setAviso('');
    try {
      const imagens = [];
      for (const foto of selecionadas) imagens.push({ dia: dataLocal(foto.t), data: await imagemParaRelatorio(foto.uri) });
      await exportarConsulta(htmlConsulta(inicio, fim, resumo, imagens));
    } catch (e) { setAviso(e instanceof Error ? e.message : 'Não foi possível criar o resumo.'); }
    finally { setOcupado(false); }
  };
  return <View style={{ flex: 1, backgroundColor: colors.bg }}>
    <ScreenHeader kicker="Nutrição" title="Resumo para o nutricionista" />
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottom + 24, gap: 12 }} keyboardShouldPersistTaps="handled">
      <Card style={{ gap: 10 }}>
        <Txt v="h2">Período da consulta</Txt>
        <Campo label="De (dd/mm/aaaa)" value={de} onChangeText={setDe} maxLength={10} />
        <Campo label="Até (dd/mm/aaaa)" value={ate} onChangeText={setAte} maxLength={10} />
        <Txt v="sub">{valido ? resumo.pesagens + ' pesagem(ns) · ' + resumo.total + ' refeição(ões) registrada(s)' : 'Confira as datas e escolha um período até hoje.'}</Txt>
      </Card>
      <Button small variant={notas ? 'primary' : 'secondary'} label={notas ? 'Notas pessoais incluídas' : 'Incluir notas pessoais'} onPress={() => setNotas(!notas)} />
      {disponiveis.length > 0 && <Card style={{ gap: 8 }}><Txt v="h2">Fotos para incluir</Txt>
        <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>{disponiveis.map((f) => <Pressable key={f.id}
          accessibilityRole="checkbox" aria-checked={ids.includes(f.id)} accessibilityLabel={'Foto de ' + br(dataLocal(f.t))}
          onPress={() => setIds(ids.includes(f.id) ? ids.filter((id) => id !== f.id) : [...ids, f.id])}>
          <Image source={{ uri: f.uri }} style={{ width: 70, height: 85, borderWidth: 3, borderColor: ids.includes(f.id) ? colors.accent : 'transparent' }} />
          <Txt v="sub">{br(dataLocal(f.t)).slice(0,5)}</Txt>
        </Pressable>)}</ScrollView>
      </Card>}
      {valido && !resumo.registros.length && !selecionadas.length && <Txt v="sub">Nenhum registro selecionado neste período.</Txt>}
      <Button label={ocupado ? 'Preparando…' : 'Gerar PDF'} icon="file" disabled={ocupado || !valido || (!resumo.registros.length && !selecionadas.length)} onPress={exportar} />
      {!!aviso && <Txt>{aviso}</Txt>}
    </ScrollView>
  </View>;
}
