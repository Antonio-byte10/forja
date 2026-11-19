// No navegador não existe Health Connect: o cartão de passos não aparece.
import type { EstadoPassos } from './passos';

export type { EstadoPassos };
export const estadoPassos = async (): Promise<EstadoPassos> => 'indisponivel';
export const pedirPermissaoPassos = async () => false;
export const abrirAjustesPassos = () => {};
export const passosPorDia = async (_dias = 7): Promise<{ dia: number; passos: number }[]> => [];
