import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { dataLocal, planoEm, refeicoesEm, type Registro } from '@/lib/nutricao';
import { useStore } from '@/store';
import { colors } from '@/theme';
import { Alternativa } from './Alternativa';
import { SonoCard } from './SonoCard';
import { Campo } from './Campo';
import { AdicionarFoto, Miniaturas } from './Fotos';
import { Icon } from './Icon';
import { Button, Card, Txt } from './ui';

export function Diario({ dia, abrirPlano, ativo = true }: { dia: string; abrirPlano?: () => void; ativo?: boolean }) {
  const registro = useStore((st) => st.nutricao.diario[dia]);
  const kg = useStore((st) => st.pesos.find((p) => dataLocal(p.t) === dia)?.kg);
  const plano = useStore((st) => planoEm(st.nutricao.planos, dia));
  const fotos = useStore((st) => st.fotos).filter((f) => dataLocal(f.t) === dia);
  const [editando, editar] = useState(false);
  const refeicoes = refeicoesEm(plano, dia);
  const completas = refeicoes.filter((r) => registro?.feitas?.includes(r.id)).length;
  const valores = [kg && kg + ' kg', registro?.altura && registro.altura + ' cm de altura',
    registro?.cintura && registro.cintura + ' cm de cintura'].filter(Boolean).join(' · ').replace(/\./g, ',');
  return (
    <>
      <Card style={{ gap: 12 }}>
        <Txt v="h2">Refeições do dia</Txt>
        {refeicoes.length > 0 ? <Txt v="label">{completas} de {refeicoes.length} concluídas</Txt> :
          <Txt v="sub">{plano ? 'Nenhuma refeição prevista para este dia.' : 'Nenhum plano alimentar em vigor nesta data.'}</Txt>}
        {!plano && abrirPlano && <Button small variant="secondary" icon="utensils" label="Abrir meu plano" onPress={abrirPlano} />}
        {refeicoes.map((r) => {
          const feita = !!registro?.feitas?.includes(r.id);
          return <View key={r.id} style={{ gap: 4 }}><Pressable accessibilityRole="checkbox" aria-checked={feita} accessibilityState={{ checked: feita }}
            accessibilityLabel={[r.nome, r.horario, r.alimentos].filter(Boolean).join(', ')}
            onPress={() => useStore.getState().marcarRefeicao(dia, r.id)}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 }}>
            <View style={{ width: 23, height: 23, borderWidth: 1, borderColor: feita ? colors.accent : colors.faint,
              borderRadius: 6, backgroundColor: feita ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {feita && <Icon name="check" size={17} color={colors.onAccent} />}
            </View>
            <View style={{ flex: 1 }}>
              <Txt>{r.nome}{r.horario ? ' · ' + r.horario : ''}</Txt>
              <Txt v="sub">{r.alimentos}</Txt>
            </View>
          </Pressable>
          {(feita || !!r.alternativas?.length || /\\bou\\b/i.test(r.alimentos)) && <Alternativa dia={dia} refeicao={r} valor={registro?.escolhas?.[r.id]} />}
          </View>;
        })}
        {!!plano?.orientacoes && <Txt v="sub">{plano.orientacoes}</Txt>}
      </Card>
      <Card style={{ gap: 12 }}>
        <Txt v="h2">Medidas e notas</Txt>
        {editando ? <EditorDiario dia={dia} registro={registro} kg={kg} fechar={() => editar(false)} /> : <>
          {!!valores && <Txt>{valores}</Txt>}
          {!!registro?.nota && <Txt>{registro.nota}</Txt>}
          {!valores && !registro?.nota && <Txt v="sub">Registre suas medidas ou anote como se sentiu.</Txt>}
          <Button small variant="secondary" icon="pencil" label={valores || registro?.nota ? 'Editar registro' : 'Adicionar registro'} onPress={() => editar(true)} />
        </>}
      </Card>
      <SonoCard key={dia} dia={dia} ativo={ativo} />
      <Card style={{ gap: 12 }}>
        <Txt v="h2">Fotos do dia</Txt>
        <Miniaturas fotos={fotos} />
        <AdicionarFoto small dia={dia} />
      </Card>
    </>
  );
}

const mostrar = (n?: number) => n === undefined ? '' : String(n).replace('.', ',');
function EditorDiario({ dia, registro, kg, fechar }: { dia: string; registro?: Registro; kg?: number; fechar: () => void }) {
  const [peso, setPeso] = useState(mostrar(kg));
  const [altura, setAltura] = useState(mostrar(registro?.altura));
  const [cintura, setCintura] = useState(mostrar(registro?.cintura));
  const [nota, setNota] = useState(registro?.nota ?? '');
  const [erro, setErro] = useState('');
  const salvar = () => {
    const medidas = [peso, altura, cintura].map((v) => {
      const s = v.trim();
      if (!s) return undefined;
      return /^\d+(?:[.,]\d+)?$/.test(s) ? Number(s.replace(',', '.')) : NaN;
    });
    if (medidas.some((n) => n !== undefined && !(n > 0 && n < 500))) {
      setErro('Confira as medidas. Use um valor entre 0 e 500, como 72,5, ou deixe em branco.');
      return;
    }
    useStore.getState().salvarDiario(dia, { altura: medidas[1], cintura: medidas[2], nota: nota.trim() || undefined }, medidas[0]);
    fechar();
  };
  return <>
    <Campo label="Peso (kg)" value={peso} onChangeText={setPeso} keyboardType="decimal-pad" />
    <Campo label="Altura (cm)" value={altura} onChangeText={setAltura} keyboardType="decimal-pad" />
    <Campo label="Cintura (cm)" value={cintura} onChangeText={setCintura} keyboardType="decimal-pad" />
    <Campo label="Notas do dia" multiline maxLength={4000} value={nota} onChangeText={setNota} />
    {!!erro && <Txt accessibilityLiveRegion="polite" style={{ color: colors.danger }}>{erro}</Txt>}
    <Button label="Salvar registro" onPress={salvar} />
    <Button small variant="ghost" label="Cancelar" onPress={fechar} />
  </>;
}
