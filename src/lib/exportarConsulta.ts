import { File } from 'expo-file-system';
import { printToFileAsync } from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function imagemParaRelatorio(uri: string) {
  const arquivo = new File(uri);
  const base64 = await arquivo.base64();
  // A galeria nativa guarda a cópia com extensão jpg; a assinatura identifica PNG e WebP.
  const tipo = base64.startsWith('iVBOR') ? 'png' : base64.startsWith('UklGR') ? 'webp' : 'jpeg';
  return 'data:image/' + tipo + ';base64,' + base64;
}
export async function exportarConsulta(html: string) {
  const { uri } = await printToFileAsync({ html });
  const arquivo = new File(uri);
  try { await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Resumo para o nutricionista' }); }
  finally { if (arquivo.exists) arquivo.delete(); }
}
