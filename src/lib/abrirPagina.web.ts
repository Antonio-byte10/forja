import { extrairPagina } from './paginaPdf';

export async function abrirPagina(bytes: ArrayBuffer, pagina: number) {
  const janela = window.open('about:blank', '_blank');
  if (!janela) throw new Error('Permita a abertura da página em uma nova aba.');
  janela.opener = null;
  try {
    const dados = await extrairPagina(bytes, pagina);
    const url = URL.createObjectURL(new Blob([new Uint8Array(dados)], { type: 'application/pdf' }));
    janela.location.replace(url);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    janela.close();
    throw err;
  }
}
