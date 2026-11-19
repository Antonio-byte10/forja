import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';

/**
 * Fotos de progresso: tiradas na câmera ou escolhidas da galeria, copiadas para a pasta do app
 * (a cópia do seletor fica no cache, que o Android pode limpar).
 */
const pasta = () => {
  const dir = new Directory(Paths.document, 'fotos');
  if (!dir.exists) dir.create();
  return dir;
};

const OPCOES: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [3, 4] };

async function guardar(res: ImagePicker.ImagePickerResult, id: string): Promise<string | undefined> {
  if (res.canceled || !res.assets?.[0]) return undefined;
  const origem = new File(res.assets[0].uri);
  const destino = new File(pasta(), `${id}.jpg`);
  if (destino.exists) destino.delete();
  await origem.copy(destino);
  return destino.uri;
}

export async function tirarFoto(id: string): Promise<string | undefined> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error('Sem permissão para a câmera.');
  return guardar(await ImagePicker.launchCameraAsync(OPCOES), id);
}

export async function escolherFoto(id: string): Promise<string | undefined> {
  return guardar(await ImagePicker.launchImageLibraryAsync(OPCOES), id);
}

/** Menu de compartilhar do Android: salvar no Drive, no Google Fotos, mandar no WhatsApp… */
export async function compartilharFoto(uri: string) {
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Foto de progresso' });
}

export function apagarArquivoFoto(uri: string) {
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // Arquivo já não existe: tudo bem.
  }
}
