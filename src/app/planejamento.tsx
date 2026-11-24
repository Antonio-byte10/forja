import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, IconButton, Opcoes, ScreenHeader, Txt } from '@/components/ui';
import { confirm, useNow } from '@/lib/platform';
import { fichaConcluida } from '@/lib/semana';
import { useStore } from '@/store';
import { colors, radius } from '@/theme';
import { dataCurta, dataLocal, deslocarDia, diaDaSemana, meioDia } from '@/lib/datas';

export default function Planejamento() {
  const hoje = dataLocal(useNow(60_000));
  const [dia, selecionar] = useState(hoje);
  const [origem, mover] = useState<string>();
  const inicio = deslocarDia(dia, -meioDia(dia).getDay());
  const dias = Array.from({ length: 7 }, (_, i) => deslocarDia(inicio, i));
  const agenda = useStore((s) => s.agenda);
  const planos = useStore((s) => s.plans);
  const historico = useStore((s) => s.history);
  const { bottom } = useSafeAreaInsets();
  const { agendar, remarcar } = useStore.getState();
  const atual = planos.find((p) => p.id === agenda[dia]);
  const feito = fichaConcluida(historico, dia, agenda[dia]);
  const disponiveis = planos.filter((p) => p.exercises.length > 0);

  async function escolher(id: string) {
    if (agenda[dia] && !await confirm('Trocar a ficha deste dia?', 'A nova ficha ocupará este horário.', 'Trocar')) return;
    agendar(dia, id);
  }

  return <View style={s.tela}>
    <ScreenHeader title="Planejamento semanal" />
    <ScrollView contentContainerStyle={[s.conteudo, { paddingBottom: bottom + 24 }]}>
      <View style={s.linha}>
        <IconButton icon="chevronLeft" label="Semana anterior" filled onPress={() => selecionar(deslocarDia(dia, -7))} />
        <Txt v="h2">{dataCurta(inicio)} – {dataCurta(dias[6])}</Txt>
        <IconButton icon="chevronRight" label="Próxima semana" filled onPress={() => selecionar(deslocarDia(dia, 7))} />
      </View>
      {origem && <Txt>Escolha um dia livre para o treino de {dataCurta(origem)}.</Txt>}
      <View style={s.lista}>{dias.map((d) => {
        const id = agenda[d];
        const ficha = planos.find((p) => p.id === id);
        const concluido = fichaConcluida(historico, d, id);
        const status = concluido ? 'Concluído' : id && d < hoje ? 'Pendente' : d === hoje ? 'Hoje' : '';
        const nome = ficha ? 'Ficha ' + ficha.name + ' · ' + ficha.title : id ? 'Ficha arquivada' : 'Livre';
        return <Pressable key={d} accessibilityRole="button" aria-selected={dia === d}
          accessibilityLabel={dataCurta(d) + ', ' + nome + ', ' + status}
          onPress={() => selecionar(d)} style={[s.dia, dia === d && s.selecionado]}>
          <View style={s.data}><Txt v="label">{diaDaSemana(d)}</Txt><Txt v="num">{meioDia(d).getDate()}</Txt></View>
          <Txt style={{ flex: 1, color: id ? colors.text : colors.sub }}>{nome}</Txt>
          {!!status && <Txt v="label" style={{ color: concluido ? colors.up : colors.accent }}>{status}</Txt>}
        </Pressable>;
      })}</View>
      <Card style={{ gap: 10 }}>
        <Txt v="h2">{dataCurta(dia)}</Txt>
        {origem ? <>
          <Button label="Mover para este dia" disabled={dia < hoje || !!agenda[dia]} onPress={() => { remarcar(origem, dia); mover(undefined); }} />
          <Button small variant="ghost" label="Cancelar remarcação" onPress={() => mover(undefined)} />
        </> : feito ? <Txt>Ficha concluída neste dia.</Txt> : <>
          {!!atual && <Button label="Remarcar treino" variant="secondary" onPress={() => mover(dia)} />}
          {dia >= hoje && disponiveis.length > 0 && <>
            <Txt v="label">{atual ? 'Trocar por outra ficha' : 'Agendar ficha'}</Txt>
            <Opcoes grande label="Ficha do dia" value={atual?.id} onChange={(id) => id !== atual?.id && escolher(id)}
              options={disponiveis.map((p) => [p.id, p.name + ' · ' + p.title] as const)} />
          </>}
          {!disponiveis.length && dia >= hoje && <Button label="Criar ficha" onPress={() => router.push('/ficha/nova')} />}
          {!!agenda[dia] && <Button small variant="ghost" label="Retirar da agenda" onPress={async () => {
            if (await confirm('Retirar o treino da agenda?', dataCurta(dia), 'Retirar')) agendar(dia);
          }} />}
          {dia < hoje && !agenda[dia] && <Txt v="sub">Dia sem treino planejado.</Txt>}
        </>}
      </Card>
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
  tela: { backgroundColor: colors.bg, flex: 1 }, conteudo: { padding: 16, gap: 16 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lista: { gap: 5 }, dia: { flexDirection: 'row', gap: 14, alignItems: 'center', padding: 10, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  selecionado: { borderColor: colors.accent, backgroundColor: colors.accentSoft }, data: { width: 40, alignItems: 'center' },
});
