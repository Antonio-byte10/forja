import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Grava o texto num arquivo temporário e abre o menu de compartilhar do Android (WhatsApp, Drive, e-mail…). */
export async function compartilharArquivo(nome: string, conteudo: string, mimeType: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartilhar não está disponível neste aparelho.');
  const file = new File(Paths.cache, nome);
  if (file.exists) file.delete();
  file.create();
  await file.write(conteudo);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: nome });
}

/** Escolhe um arquivo no aparelho e devolve o texto dele (`undefined` se cancelar). */
export async function abrirArquivo(): Promise<string | undefined> {
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (res.canceled || !res.assets[0]) return undefined;
  return new File(res.assets[0].uri).text();
}
