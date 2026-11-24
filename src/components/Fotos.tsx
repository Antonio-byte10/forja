import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apagarArquivoFoto, compartilharFoto, escolherFoto, tirarFoto } from '@/lib/fotos';
import { confirm } from '@/lib/platform';
import type { Foto } from '@/lib/types';
import { uid } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, radius } from '@/theme';
import { Icon } from './Icon';
import { Button, IconButton, Txt } from './ui';
import { dataLocal, formatarData, meioDia } from '@/lib/datas';

export const dataCurta = (t: number) =>
  formatarData(t, { day: 'numeric', month: 'short', year: '2-digit' });

/** Botões de câmera e galeria. A foto fica com a data `t` e, se vier de um treino, ligada a ele. */
export function AdicionarFoto({ t, dia, sessionId, small }: { t?: number; dia?: string; sessionId?: string; small?: boolean }) {
  const [erro, setErro] = useState<string>();
  const add = async (fonte: 'camera' | 'galeria') => {
    setErro(undefined);
    const id = uid();
    try {
      const uri = fonte === 'camera' ? await tirarFoto(id) : await escolherFoto(id);
      const agora = Date.now();
      const data = dia && dia !== dataLocal(agora) ? meioDia(dia).getTime() : agora;
      if (uri) useStore.getState().addFoto({ id, uri, t: t ?? data, ...(sessionId && { sessionId }) });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para salvar a foto.');
    }
  };
  return (
    <View style={{ gap: 6 }}>
      <View style={s.addRow}>
        <Button small={small} variant="secondary" icon="camera" label="Tirar foto" onPress={() => add('camera')} style={{ flex: 1 }} />
        <Button small={small} variant="secondary" icon="image" label="Da galeria" onPress={() => add('galeria')} style={{ flex: 1 }} />
      </View>
      {erro && <Txt v="sub" style={{ color: colors.danger }}>{erro}</Txt>}
    </View>
  );
}

/** Tela cheia: a foto (ou duas lado a lado, para comparar), com data e apagar. */
export function VerFotos({ fotos, onClose }: { fotos: Foto[]; onClose: () => void }) {
  const remover = async (f: Foto) => {
    if (!(await confirm('Apagar esta foto?', 'Não dá para desfazer.', 'Apagar'))) return;
    useStore.getState().deleteFoto(f.id);
    apagarArquivoFoto(f.uri);
    if (fotos.length <= 1) onClose();
  };
  return (
    <Modal visible={fotos.length > 0} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={s.viewer}>
        <View style={s.viewerTop}>
          <Txt v="h2" style={{ flex: 1 }}>{fotos.length > 1 ? 'Antes e depois' : dataCurta(fotos[0]?.t ?? 0)}</Txt>
          <IconButton icon="x" label="Fechar" onPress={onClose} filled />
        </View>
        <View style={s.viewerBody}>
          {fotos.map((f) => (
            <View key={f.id} style={{ flex: 1, gap: 8 }}>
              <Image source={{ uri: f.uri }} style={s.full} resizeMode="contain" accessibilityLabel={`Foto de ${dataCurta(f.t)}`} />
              <View style={s.viewerFoot}>
                <Txt v="label" style={{ flex: 1, color: colors.text }}>{dataCurta(f.t)}</Txt>
                {fotos.length === 1 && (
                  <>
                    <IconButton icon="share" label="Compartilhar ou salvar a foto" onPress={() => compartilharFoto(f.uri).catch(() => {})} size={40} />
                    <IconButton icon="trash" label="Apagar foto" color={colors.danger} onPress={() => remover(f)} size={40} />
                  </>
                )}
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/** Miniaturas de um treino (ou de qualquer lista), com o visualizador. */
export function Miniaturas({ fotos, size = 64 }: { fotos: Foto[]; size?: number }) {
  const [aberta, setAberta] = useState<Foto>();
  if (!fotos.length) return null;
  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {fotos.map((f) => (
          <Pressable key={f.id} onPress={() => setAberta(f)} accessibilityRole="button" accessibilityLabel={`Ver foto de ${dataCurta(f.t)}`}>
            <Image source={{ uri: f.uri }} style={[s.thumb, { width: size, height: size * (4 / 3) }]} />
          </Pressable>
        ))}
      </ScrollView>
      <VerFotos fotos={aberta ? [aberta] : []} onClose={() => setAberta(undefined)} />
    </>
  );
}

/** Fotos ligadas a um treino + botões para adicionar. */
export function FotosDoTreino({ sessionId, t }: { sessionId: string; t: number }) {
  const fotos = useStore((st) => st.fotos).filter((f) => f.sessionId === sessionId);
  return (
    <View style={{ gap: 8 }}>
      <View style={s.head}>
        <Icon name="camera" size={16} color={colors.sub} />
        <Txt v="label" style={{ flex: 1 }}>Foto do dia{fotos.length > 1 ? `s (${fotos.length})` : ''}</Txt>
      </View>
      <Miniaturas fotos={fotos} />
      <AdicionarFoto t={t} sessionId={sessionId} small />
    </View>
  );
}

const s = StyleSheet.create({
  addRow: { flexDirection: 'row', gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  thumb: { borderRadius: radius.sm, backgroundColor: colors.raised },
  viewer: { flex: 1, backgroundColor: '#000' },
  viewerTop: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  viewerBody: { flex: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 6 },
  full: { flex: 1, width: '100%' },
  viewerFoot: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 12 },
});
