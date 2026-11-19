/** No navegador: baixa o arquivo. */
export async function compartilharArquivo(nome: string, conteudo: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: mimeType }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** No navegador: abre o seletor de arquivos e lê o texto. */
export function abrirArquivo(): Promise<string | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt,application/json,text/plain';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) resolve(undefined);
      else file.text().then(resolve, () => resolve(undefined));
    };
    input.click();
  });
}
