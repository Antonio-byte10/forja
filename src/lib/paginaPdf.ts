export async function extrairPagina(bytes: ArrayBuffer, pagina: number) {
  // A distribuição autocontida evita a incompatibilidade de tslib com o Metro.
  const { PDFDocument } = await import('pdf-lib/dist/pdf-lib.min.js');
  const origem = await PDFDocument.load(bytes);
  if (!Number.isInteger(pagina) || pagina < 1 || pagina > origem.getPageCount()) throw new Error('Página fora do documento.');
  const copia = await PDFDocument.create();
  const [folha] = await copia.copyPages(origem, [pagina - 1]);
  copia.addPage(folha);
  return copia.save();
}
