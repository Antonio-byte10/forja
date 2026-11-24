import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { planoValido, type PlanoAlimentar } from './nutricao';
import { confirm } from './platform';
import { chamarServico, ROTAS } from './servicoIa';
import { uid } from './workout';

export async function importarPlano(signal: AbortSignal): Promise<{ plano: PlanoAlimentar; pdf: ArrayBuffer } | undefined> {
  const escolha = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true, base64: false });
  if (escolha.canceled || !escolha.assets[0]) return;
  const pdf = escolha.assets[0];
  const arquivo = Platform.OS === 'web' ? pdf.file : new File(pdf.uri);
  try {
    if (signal.aborted) return;
    if (!arquivo || !arquivo.size || arquivo.size > 8 * 1024 * 1024) throw new Error('Escolha um PDF de até 8 MB.');
    if (!await confirm('Enviar PDF ao Gemini?', pdf.name + ' será enviado à Google pelo servidor de IA para extrair as refeições. Você poderá revisar o resultado antes de aplicar.', 'Enviar PDF') || signal.aborted) return;
    const body = await arquivo.arrayBuffer();
    const dados = await chamarServico(ROTAS.plano, body, signal);
    const plano = { orientacoes: dados.orientacoes, refeicoes: Array.isArray(dados.refeicoes)
      ? dados.refeicoes.map((r: object) => ({ ...r, id: uid() })) : [] };
    if (!planoValido(plano)) throw new Error('O PDF não retornou um plano completo. Confira o documento ou preencha manualmente.');
    return { plano, pdf: body };
  } finally {
    if (Platform.OS === 'web') URL.revokeObjectURL(pdf.uri);
    else if (pdf.uri.startsWith(Paths.cache.uri.replace(/\/$/, '') + '/')) {
      const copia = new File(pdf.uri);
      if (copia.exists) copia.delete();
    }
  }
}
