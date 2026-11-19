// No navegador não há notificação agendada: o cronômetro vibra/avisa com a página aberta.
export const prepararAvisos = async () => false;
export const agendarAviso = async (_segundos: number, _title: string, _body: string): Promise<string | undefined> => undefined;
export const cancelarAviso = (_id?: string) => {};
