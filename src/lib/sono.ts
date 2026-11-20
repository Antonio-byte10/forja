/** Implementação para plataformas sem o Health Connect. */
export async function lerSono(_dia: string, _pedir: boolean): Promise<number | undefined> {
  throw new Error('A conexão com o Health Connect está disponível no Android.');
}
