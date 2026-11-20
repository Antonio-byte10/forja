import { File, Paths } from 'expo-file-system';
import { startActivityAsync } from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { extrairPagina } from './paginaPdf';
import { uid } from './workout';

export async function abrirPagina(bytes: ArrayBuffer, pagina: number) {
  const file = new File(Paths.cache, 'forja-pagina-' + pagina + '-' + uid() + '.pdf');
  try {
    const dados = await extrairPagina(bytes, pagina);
    await file.write(dados);
    if (Platform.OS === 'android') {
      await startActivityAsync('android.intent.action.VIEW', { data: file.contentUri, type: 'application/pdf', flags: 1 });
    } else {
      await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    }
  } finally {
    if (file.exists) file.delete();
  }
}
