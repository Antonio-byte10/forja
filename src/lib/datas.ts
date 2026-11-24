/** Datas do app: dias guardados como "AAAA-MM-DD" no fuso do aparelho. */

export const DIA_MS = 86_400_000;

/** Dia local de um instante, no formato "AAAA-MM-DD". */
export const dataLocal = (t: Date | number) => {
  const d = new Date(t);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
};

/** Meio-dia do dia: evita pular de data com horário de verão. */
export const meioDia = (dia: string) => new Date(dia + 'T12:00:00');

export const dataValida = (dia: string) => /^\d{4}-\d{2}-\d{2}$/.test(dia) && dataLocal(meioDia(dia)) === dia;

export function deslocarDia(dia: string, delta: number) {
  const data = meioDia(dia);
  data.setDate(data.getDate() + delta);
  return dataLocal(data);
}

const paraData = (d: string | number | Date) => (typeof d === 'string' ? meioDia(d) : new Date(d));

/** Data em português, sem os pontos de abreviação ("seg, 24 de nov"). */
export const formatarData = (d: string | number | Date, opcoes?: Intl.DateTimeFormatOptions) =>
  paraData(d).toLocaleDateString('pt-BR', opcoes).replace(/\./g, '');

/** "24 de nov" */
export const dataCurta = (d: string | number | Date) => formatarData(d, { day: 'numeric', month: 'short' });

/** "seg" */
export const diaDaSemana = (d: string | number | Date) => formatarData(d, { weekday: 'short' });

/** 450 → "7h30" */
export const formatarHoras = (min: number) => Math.floor(min / 60) + 'h' + String(min % 60).padStart(2, '0');
