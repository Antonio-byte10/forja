import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNow } from '@/lib/platform';
import { gastoDiario, resumoSeteDias } from '@/lib/semana';
import { useStore } from '@/store';
import { colors, fonts } from '@/theme';
import { Button, Card, Txt } from './ui';
import { dataLocal, diaDaSemana, formatarData, formatarHoras } from '@/lib/datas';
import { chamarServico, PRAZO_IA, ROTAS } from '@/lib/servicoIa';

function Motivacao({ diasAtivos }: { diasAtivos: number }) {
  const [mensagem, setMensagem] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const pedido = useRef<AbortController | null>(null);
  useEffect(() => () => { pedido.current?.abort(); pedido.current = null; }, []);
  async function gerar() {
    if (pedido.current) return;
    const controle = new AbortController();
    pedido.current = controle;
    setOcupado(true);
    setAviso('');
    const prazo = setTimeout(() => controle.abort(), PRAZO_IA);
    try {
      const dados = await chamarServico(ROTAS.motivacao, JSON.stringify({ diasAtivos }), controle.signal);
      if (typeof dados.mensagem !== 'string' || !dados.mensagem.trim()) throw new Error('A IA não devolveu uma mensagem. Tente novamente.');
      if (pedido.current === controle) setMensagem(dados.mensagem);
    } catch (e) {
      if (pedido.current === controle) setAviso(controle.signal.aborted ? 'A IA demorou demais. Tente novamente.' : e instanceof Error ? e.message : 'Não foi possível gerar a mensagem.');
    } finally {
      clearTimeout(prazo);
      if (pedido.current === controle) { pedido.current = null; setOcupado(false); }
    }
  }
  const local = diasAtivos ? 'Vale olhar para o que coube na sua semana. Qual momento você gostaria de repetir?' : 'Sua semana pode começar com um plano pequeno. Escolha um dia que funcione para você.';
  return <Card style={s.card}>
    <Txt v="label">{mensagem ? 'Mensagem do Gemini' : 'Mensagem do Forja'}</Txt>
    <Txt v="h2">{mensagem || local}</Txt>
    <Txt v="sub">Ao gerar, você envia ao Gemini apenas a quantidade de dias com treino registrado nos últimos sete dias.</Txt>
    <Button small variant="secondary" label={ocupado ? 'Gerando mensagem…' : 'Gerar mensagem com IA'} onPress={gerar} disabled={ocupado} />
    {!!aviso && <>
      <Txt v="sub" accessibilityLiveRegion="polite">{aviso}</Txt>
      <Button small variant="ghost" label="Configurar servidor de IA" onPress={() => router.push('/servidor-ia')} />
    </>}
  </Card>;
}

export function PainelSemanal() {
  const hoje = dataLocal(useNow(60000));
  const history = useStore((s) => s.history);
  const diario = useStore((s) => s.nutricao.diario);
  const perfil = useStore((s) => s.perfil);
  const resumo = useMemo(() => resumoSeteDias(hoje, history, diario), [hoje, history, diario]);
  const pico = Math.max(1, ...resumo.dias.map((d) => d.minutos));
  const ativos = resumo.dias.filter((d) => d.treinos).length;
  const sono = resumo.sonoMedio;
  const curta = (dia: string) => formatarData(dia, { day: '2-digit', month: '2-digit' });
  return <>
    <Card style={s.card}>
      <View style={s.linha}><Txt v="h2">Minha semana</Txt><Txt v="label">{curta(resumo.dias[0].dia)} – {curta(hoje)}</Txt></View>
      <View style={s.total}><Txt v="hero" style={{ color: colors.accent }}>{resumo.minutos}</Txt><Txt>min de treino</Txt></View>
      <View style={s.grafico}>{resumo.dias.map((d) =>
        <Pressable key={d.dia} accessibilityRole="button" accessibilityLabel={'Abrir diário de ' + curta(d.dia) + ', ' + d.treinos + ' treinos, ' + Math.round(d.minutos) + ' minutos'}
          style={s.coluna} onPress={() => router.push({ pathname: '/diario/[data]', params: { data: d.dia } })}>
          <View style={s.trilho}><View style={[s.barra, { height: Math.max(d.treinos ? 3 : 1, 50 * d.minutos / pico), backgroundColor: d.treinos ? colors.accent : colors.line }]} /></View>
          <Txt v="sub" style={{ fontSize: 12 }}>{diaDaSemana(d.dia)}</Txt>
        </Pressable>)}</View>
      <View style={s.metricas}>
        <View style={s.metrica}><Txt v="num">{resumo.treinos}</Txt><Txt v="sub">treinos</Txt></View>
        <View style={s.metrica}><Txt v="num">{resumo.refeicoes}</Txt><Txt v="sub">refeições marcadas</Txt></View>
        <View style={s.metrica}><Txt v="num">{sono === undefined ? '—' : formatarHoras(sono)}</Txt><Txt v="sub">sono médio</Txt></View>
      </View>
      <Txt v="sub">{resumo.noites} de 7 noites com sono registrado.</Txt>
    </Card>
    <Card style={s.card}>
      <Txt v="h2">Gasto energético diário</Txt>
      {perfil ? <>
        <View style={s.total}><Txt v="num" style={s.energia}>{gastoDiario(perfil).toLocaleString('pt-BR')}</Txt><Txt>kcal/dia estimadas</Txt></View>
        <Txt v="sub">{perfil.idade} anos · {perfil.peso.toLocaleString('pt-BR')} kg · {perfil.altura} cm · rotina {perfil.atividade.toLowerCase()}</Txt>
        <Txt v="sub">Média prevista pela equação DRI 2023 para o perfil salvo. Inclui a atividade habitual. O gasto real varia de um dia para outro.</Txt>
      </> : <Txt v="sub">Informe idade, peso, altura, sexo e atividade habitual para ver sua estimativa.</Txt>}
      <Button small variant="secondary" label={perfil ? 'Editar perfil energético' : 'Preencher perfil energético'} onPress={() => router.push('/perfil')} />
    </Card>
    <Motivacao key={hoje + '/' + ativos} diasAtivos={ativos} />
  </>;
}
const s = StyleSheet.create({
  card: { gap: 12 }, linha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  total: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 8 },
  grafico: { flexDirection: 'row', gap: 6 }, coluna: { flex: 1, alignItems: 'center', gap: 4 },
  trilho: { height: 50, width: '70%', justifyContent: 'flex-end' }, barra: { width: '100%', borderRadius: 4 },
  metricas: { flexDirection: 'row', borderTopWidth: 1, borderColor: colors.line, paddingTop: 10, gap: 6 },
  metrica: { flex: 1 }, energia: { fontFamily: fonts.displayHeavy, fontSize: 38, lineHeight: 44, color: colors.accent },
});
