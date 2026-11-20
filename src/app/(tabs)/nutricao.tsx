import { router } from 'expo-router';
import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Diario } from '@/components/Diario';
import { GaleriaFotos } from '@/components/GaleriaFotos';
import { Icon } from '@/components/Icon';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Button, Card, Txt } from '@/components/ui';
import { dataLocal, planoEm } from '@/lib/nutricao';
import { useNow } from '@/lib/platform';
import { useStore } from '@/store';
import { colors, fonts, radius } from '@/theme';

const secoes = [
  { nome: 'Diário', icone: 'pencil' },
  { nome: 'Plano', icone: 'utensils' },
  { nome: 'Calendário', icone: 'calendar' },
  { nome: 'Fotos', icone: 'camera' },
] as const;
type Secao = typeof secoes[number]['nome'];

export default function Nutricao() {
  const [secao, selecionar] = useState<Secao>('Diário');
  const abrirSecao = (nome: Secao) => {
    Keyboard.dismiss();
    selecionar(nome);
  };
  const hoje = new Date(useNow(60000));
  const dia = dataLocal(hoje);
  const plano = useStore((st) => planoEm(st.nutricao.planos, dia));
  const historico = useStore((st) => st.history);
  const { top } = useSafeAreaInsets();
  return <View style={[s.screen, { paddingTop: top + 16 }]}>
    <View style={s.header}>
      <Txt v="hero">Nutrição</Txt>
      <View style={s.tabs} accessibilityRole="tablist" accessibilityLabel="Seções de nutrição">
        {secoes.map(({ nome, icone }) => {
          const ativa = secao === nome;
          const cor = ativa ? colors.accent : colors.sub;
          return <Pressable key={nome} accessibilityRole="tab" accessibilityLabel={nome}
            aria-selected={ativa} accessibilityState={{ selected: ativa }}
            onPress={() => abrirSecao(nome)} style={[s.tab, ativa && s.ativa]}>
            <Icon name={icone} size={19} color={cor} />
            <Txt style={[s.rotulo, { color: cor }]}>{nome}</Txt>
          </Pressable>;
        })}
      </View>
    </View>
    <ScrollView style={secao !== 'Diário' && s.oculta} keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets contentContainerStyle={s.content}>
      <Txt v="h2">{hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</Txt>
      <Diario dia={dia} ativo={secao === 'Diário'} key={dia} abrirPlano={() => abrirSecao('Plano')} />
    </ScrollView>
    {secao !== 'Diário' && <ScrollView key={secao} contentContainerStyle={s.content}>
    {secao === 'Plano' && <>
      <Card style={{ gap: 12 }}>
        <Txt v="h2">Meu plano alimentar</Txt>
        <Txt v="sub">{plano ? plano.refeicoes.length + (plano.refeicoes.length === 1 ? ' refeição cadastrada' : ' refeições cadastradas') : 'Organize as refeições do seu nutricionista, com horários, porções e alternativas.'}</Txt>
        <Button icon={plano ? 'pencil' : 'plus'} label={plano ? 'Editar ou importar plano' : 'Cadastrar plano'} onPress={() => router.push('/plano-alimentar')} />
      </Card>
      {plano?.refeicoes.map((r) => <Card key={r.id} style={{ gap: 5 }}>
        <Txt v="label">{r.dias.length ? [...r.dias].sort().map((n) => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][n]).join(' · ') : 'Todos os dias'}</Txt>
        <Txt v="h2">{r.nome}{r.horario && ' · ' + r.horario}</Txt>
        <Txt>{r.alimentos}</Txt>
      </Card>)}
      {!!plano?.orientacoes && <Card style={{ gap: 6 }}><Txt v="h2">Orientações</Txt><Txt>{plano.orientacoes}</Txt></Card>}
    </>}
    {secao === 'Calendário' && <>
      <MonthCalendar history={historico} />
      <Button variant="secondary" icon="file" label="Resumo para o nutricionista" onPress={() => router.push('/consulta')} />
    </>}
    {secao === 'Fotos' && <GaleriaFotos />}
    </ScrollView>}
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, gap: 12 },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, padding: 4, borderRadius: radius.md },
  tab: { flex: 1, minHeight: 54, paddingVertical: 6, alignItems: 'center', justifyContent: 'center', gap: 2,
    borderRadius: radius.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  ativa: { backgroundColor: colors.accentSoft, borderBottomColor: colors.accent },
  rotulo: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  oculta: { display: 'none' },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 14 },
});
