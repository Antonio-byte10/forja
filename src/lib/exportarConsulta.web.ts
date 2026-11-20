export async function imagemParaRelatorio(uri: string) {
  if (/^data:image\/(jpeg|png|webp);base64,/i.test(uri)) return uri;
  throw new Error('Não foi possível incluir a foto selecionada.');
}
export async function exportarConsulta(html: string) {
  const janela = window.open('', '_blank');
  if (!janela) throw new Error('Permita a abertura da prévia para imprimir ou salvar o PDF.');
  janela.opener = null;
  janela.document.write(html);
  janela.document.close();
  await Promise.all(Array.from(janela.document.images).map((img) => img.decode()));
  janela.focus();
  janela.print();
}
