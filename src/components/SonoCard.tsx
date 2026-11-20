import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { disposicoes, type Registro } from '@/lib/nutricao';
import { lerSono } from '@/lib/sono';
import { useStore } from '@/store';
import { Button, Card, Txt } from './ui';
import { Campo } from './Campo';

export const duracaoSono = (min: number) => Math.floor(min / 60) + 'h' + String(min % 60).padStart(2, '0');

export function SonoCard({ dia, ativo }: { dia: string; ativo: boolean }) {
  const registro = useStore((s) => s.nutricao.diario[dia]);
  const conectar = useStore((s) => s.ajustes.conectarSono);
  const [editar, setEditar] = useState(false);
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const versao = useRef(0);
  const consultar = useCallback(async (pedir: boolean) => {
    const id = ++versao.current;
    const anterior = useStore.getState().nutricao.diario[dia]?.sono;
    setOcupado(true);
    setAviso('');
    try {
      const minutos = await lerSono(dia, pedir);
      if (id !== versao.current) return;
      if (pedir) useStore.getState().setAjustes({ conectarSono: true });
      if (!minutos) {
        setAviso('Nenhum sono disponível para esta noite. Confira se o Samsung Health ou outro app compartilha sono com o Health Connect.');
      } else if (anterior === useStore.getState().nutricao.diario[dia]?.sono && (anterior?.fonte !== 'manual' || pedir)) {
        useStore.getState().atualizarBemEstar(dia, { sono: { minutos, fonte: 'Health Connect' } });
      }
    } catch (e) {
      if (id === versao.current) setAviso(e instanceof Error ? e.message : 'Falha ao ler o sono.');
    } finally {
      if (id === versao.current) setOcupado(false);
    }
  }, [dia]);
  useFocusEffect(useCallback(() => {
    const st = useStore.getState();
    if (ativo && Platform.OS === 'android' && st.ajustes.conectarSono && st.nutricao.diario[dia]?.sono?.fonte !== 'manual') void consultar(false);
    else setOcupado(false);
    return () => { versao.current++; };
  }, [ativo, consultar, dia]));
  return <Card style={{ gap: 10 }}>
    <Txt v="h2">Sono e disposição</Txt>
    {!!registro?.sono && <Txt>{duracaoSono(registro.sono.minutos)} de sono · {registro.sono.fonte === 'manual' ? 'Registro manual' : 'Health Connect'}</Txt>}
    {!!registro?.disposicao && <Txt v="sub">Disposição: {registro.disposicao}</Txt>}
    {editar ? <Editor dia={dia} registro={registro} fechar={() => setEditar(false)} /> :
      <Button small icon="pencil" variant="secondary" label={registro?.sono || registro?.disposicao ? 'Editar sono e disposição' : 'Anotar sono e disposição'} onPress={() => setEditar(true)} />}
    {Platform.OS === 'android' && !editar && <>
      <Button small variant="ghost" disabled={ocupado} label={ocupado ? 'Lendo sono…' : conectar ? 'Atualizar pelo Health Connect' : 'Conectar sono do Android'}
        onPress={() => void consultar(true)} />
      {(conectar || aviso) && <Txt v="sub">Leitura da noite entre o meio-dia anterior e o meio-dia deste dia.</Txt>}
      {conectar && <Button small variant="ghost" label="Desligar leitura automática" onPress={() => {
        versao.current++; setOcupado(false); setAviso(''); useStore.getState().setAjustes({ conectarSono: false });
      }} />}
    </>}
    {!!aviso && <Txt v="sub" accessibilityLiveRegion="polite">{aviso}</Txt>}
  </Card>;
}

function Editor({ dia, registro, fechar }: { dia: string; registro?: Registro; fechar: () => void }) {
  const inicial = registro?.sono ? duracaoSono(registro.sono.minutos).replace('h', ':') : '';
  const [horas, setHoras] = useState(inicial);
  const [disposicao, setDisposicao] = useState(registro?.disposicao);
  const [erro, setErro] = useState('');
  const salvar = () => {
    const match = /^(\d{1,2}):([0-5]\d)$/.exec(horas.trim());
    const min = match ? Number(match[1]) * 60 + Number(match[2]) : 0;
    if (horas.trim() && (!match || min === 0 || min > 1440)) { setErro('Use horas e minutos, como 7:30.'); return; }
    const patch: Pick<Registro, 'sono' | 'disposicao'> = { disposicao };
    if (horas !== inicial) patch.sono = min ? { minutos: min, fonte: 'manual' } : undefined;
    useStore.getState().atualizarBemEstar(dia, patch);
    fechar();
  };
  return <View style={{ gap: 8 }}>
    <Campo label="Tempo de sono (h:mm)" placeholder="7:30" maxLength={5} value={horas} onChangeText={setHoras} />
    <Txt v="label">Disposição</Txt>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {disposicoes.map((d) => <Button key={d} small label={d} variant={d === disposicao ? 'primary' : 'secondary'}
        onPress={() => setDisposicao(d === disposicao ? undefined : d)} />)}
    </View>
    {!!erro && <Txt>{erro}</Txt>}
    <Button small label="Salvar sono e disposição" onPress={salvar} />
    <Button small variant="ghost" label="Cancelar" onPress={fechar} />
  </View>;
}
