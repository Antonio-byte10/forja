import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Campo } from '@/components/Campo';
import { Button, Card, IconButton, ScreenHeader, Txt } from '@/components/ui';
import { abrirPagina } from '@/lib/abrirPagina';
import { importarPlano } from '@/lib/importarPlano';
import { dataLocal, planoEm, planoValido, type PlanoAlimentar, type Refeicao } from '@/lib/nutricao';
import { useNow } from '@/lib/platform';
import { uid } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, radius } from '@/theme';

const nova = (): Refeicao => ({ id: uid(), nome: '', horario: '', alimentos: '', dias: [] });
const semana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function EditorPlano() {
  const hoje = dataLocal(useNow(60_000));
  const { bottom } = useSafeAreaInsets();
  const [plano, setPlano] = useState<PlanoAlimentar>(() => planoEm(useStore.getState().nutricao.planos, hoje)
    ?? { orientacoes: '', refeicoes: [nova()] });
  const [pdf, setPdf] = useState<ArrayBuffer>();
  const [paginaOcupada, setPaginaOcupada] = useState(false);
  const [aviso, setAviso] = useState('');
  const [lendo, setLendo] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const pedido = useRef<AbortController | null>(null);
  useEffect(() => () => pedido.current?.abort(), []);
  const importar = async () => {
    if (pedido.current) return;
    const controle = new AbortController();
    pedido.current = controle;
    setLendo(true);
    setAviso('');
    try {
      const extraido = await importarPlano(controle.signal);
      if (extraido && !controle.signal.aborted) {
        setPlano(extraido.plano);
        setPdf(extraido.pdf);
        setAviso('Confira as porções, alternativas e dias com o PDF original antes de aplicar.');
      }
    } catch (e) {
      if (!controle.signal.aborted) setAviso(e instanceof Error ? e.message : 'Falha ao importar o PDF.');
    } finally {
      pedido.current = null;
      if (!controle.signal.aborted) setLendo(false);
    }
  };
  const alterar = (id: string, patch: Partial<Refeicao>) => setPlano((p) => ({
    ...p, refeicoes: p.refeicoes.map((r) => r.id === id ? { ...r, ...patch } : r),
  }));
  const salvar = () => {
    if (!planoValido(plano)) {
      scroll.current?.scrollTo({ y: 0, animated: true });
      setAviso('Inclua ao menos uma refeição. Preencha o nome e os alimentos de cada refeição.');
      return;
    }
    useStore.getState().salvarPlanoAlimentar(hoje, plano);
    if (router.canGoBack()) router.back();
    else router.replace('/nutricao');
  };
  return <View style={{ flex: 1, backgroundColor: colors.bg }}>
    <ScreenHeader kicker="Nutrição" title="Editar plano alimentar" />
    <ScrollView ref={scroll} automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 16, paddingBottom: bottom + 32, gap: 14 }}>
      <Card style={{ gap: 10 }}>
        <Txt v="h2">Plano do nutricionista</Txt>
        <Txt v="sub">Preencha as refeições ou importe um PDF de até 8 MB. O plano passa a valer a partir de hoje.</Txt>
        <Button variant="secondary" icon="upload" label={lendo ? 'Aguardando leitura…' : 'Importar PDF com Gemini'} disabled={lendo} onPress={importar} />
        {!!aviso && <Txt accessibilityLiveRegion="polite" style={{ color: colors.accent }}>{aviso}</Txt>}
      </Card>
      {plano.refeicoes.map((r, i) => <Card key={r.id} style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt v="h2">Refeição {i + 1}</Txt>
          <IconButton icon="trash" label={'Remover refeição ' + (i + 1)} disabled={lendo}
            onPress={() => setPlano((p) => ({ ...p, refeicoes: p.refeicoes.filter((x) => x.id !== r.id) }))} />
        </View>
        {!!pdf && !!r.pagina && <Button small icon="file" variant="ghost" label={'Conferir página ' + r.pagina + ' do PDF'}
          disabled={paginaOcupada || lendo} onPress={async () => {
            setPaginaOcupada(true);
            try { await abrirPagina(pdf, r.pagina!); }
            catch { setAviso('Não foi possível abrir essa página. Confira o PDF original no seu leitor.'); scroll.current?.scrollTo({ y: 0 }); }
            finally { setPaginaOcupada(false); }
          }} />}
        <Campo label="Refeição" placeholder="Ex. Café da manhã" value={r.nome} editable={!lendo} maxLength={100} onChangeText={(nome) => alterar(r.id, { nome })} />
        <Campo label="Horário (opcional)" placeholder="Ex. 7h ou após o treino" value={r.horario} editable={!lendo} maxLength={60} onChangeText={(horario) => alterar(r.id, { horario })} />
        <Campo label="Alimentos e porções" multiline value={r.alimentos} editable={!lendo} maxLength={4000} onChangeText={(alimentos) => alterar(r.id, { alimentos })} />
        <Campo label="Alternativas (uma por linha)" multiline value={(r.alternativas ?? []).join('\n')} editable={!lendo}
          onChangeText={(texto) => alterar(r.id, { alternativas: texto.split('\n') })} />
        <Txt v="label">Dias da semana</Txt>
        <Txt v="sub">{r.dias.length ? 'Nos dias marcados' : 'Todos os dias'}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
          {semana.map((d, n) => <Pressable key={d} accessibilityRole="checkbox" accessibilityLabel={d} aria-checked={r.dias.includes(n)} accessibilityState={{ checked: r.dias.includes(n) }}
            disabled={lendo} onPress={() => alterar(r.id, { dias: r.dias.includes(n) ? r.dias.filter((x) => x !== n) : [...r.dias, n] })}
            style={{ borderRadius: radius.sm, backgroundColor: r.dias.includes(n) ? colors.accentSoft : colors.raised, padding: 9 }}>
            <Txt style={{ color: r.dias.includes(n) ? colors.accent : colors.sub }}>{d}</Txt>
          </Pressable>)}
        </View>
      </Card>)}
      <Button small variant="ghost" icon="plus" label="Adicionar refeição" disabled={lendo || plano.refeicoes.length >= 60}
        onPress={() => setPlano((p) => ({ ...p, refeicoes: [...p.refeicoes, nova()] }))} />
      <Card><Campo label="Orientações gerais" multiline maxLength={6000} editable={!lendo} value={plano.orientacoes}
        onChangeText={(orientacoes) => setPlano((p) => ({ ...p, orientacoes }))} /></Card>
      <Button label="Aplicar plano a partir de hoje" icon="check" disabled={lendo} onPress={salvar} />
    </ScrollView>
  </View>;
}
