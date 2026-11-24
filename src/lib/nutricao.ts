import { dataValida, meioDia } from './datas';

export type Refeicao = {
  id: string;
  nome: string;
  horario: string;
  alimentos: string;
  alternativas?: string[];
  pagina?: number;
  /** Domingo = 0. Lista vazia indica todos os dias. */
  dias: number[];
};
export type PlanoAlimentar = { orientacoes: string; refeicoes: Refeicao[] };
export type Sono = { minutos: number; fonte: 'manual' | 'Health Connect' };
export const disposicoes = ['Baixa', 'Regular', 'Boa'] as const;
export type Registro = {
  altura?: number; cintura?: number; nota?: string; feitas?: string[];
  escolhas?: Record<string, string>; sono?: Sono; disposicao?: typeof disposicoes[number];
};
export type Nutricao = { planos: Record<string, PlanoAlimentar>; diario: Record<string, Registro> };

export const planoEm = (planos: Nutricao['planos'], dia: string) => {
  const inicio = Object.keys(planos).filter((d) => d <= dia).sort().at(-1);
  return inicio ? planos[inicio] : undefined;
};
export const refeicoesEm = (plano: PlanoAlimentar | undefined, dia: string) =>
  plano?.refeicoes.filter((r) => !r.dias.length || r.dias.includes(meioDia(dia).getDay())) ?? [];

const objeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const texto = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
const idValido = (v: unknown): v is string => texto(v, 80) && !!v.trim();

export function refeicaoValida(v: unknown): v is Refeicao {
  return objeto(v) && idValido(v.id) && texto(v.nome, 100) && !!v.nome.trim()
    && texto(v.horario, 60) && texto(v.alimentos, 4000) && !!v.alimentos.trim()
    && (v.pagina === undefined || (Number.isInteger(v.pagina) && Number(v.pagina) >= 1))
    && (v.alternativas === undefined || (Array.isArray(v.alternativas) && v.alternativas.length <= 40 && v.alternativas.every((a) => texto(a, 1000))))
    && Array.isArray(v.dias) && v.dias.length <= 7 && v.dias.every((d) => Number.isInteger(d) && d >= 0 && d < 7);
}

export function planoValido(v: unknown): v is PlanoAlimentar {
  return objeto(v) && texto(v.orientacoes, 6000) && Array.isArray(v.refeicoes)
    && v.refeicoes.length > 0 && v.refeicoes.length <= 60 && v.refeicoes.every(refeicaoValida)
    && new Set(v.refeicoes.map((r) => r.id)).size === v.refeicoes.length;
}

function registroValido(v: unknown): v is Registro {
  const medida = (n: unknown) => n === undefined || (typeof n === 'number' && n > 0 && n < 500);
  return objeto(v) && medida(v.altura) && medida(v.cintura) && (v.nota === undefined || texto(v.nota, 4000))
    && (v.sono === undefined || (objeto(v.sono) && Number.isInteger(v.sono.minutos) && Number(v.sono.minutos) > 0 && Number(v.sono.minutos) <= 1500
      && (v.sono.fonte === 'manual' || v.sono.fonte === 'Health Connect')))
    && (v.disposicao === undefined || disposicoes.some((d) => d === v.disposicao))
    && (v.escolhas === undefined || (objeto(v.escolhas) && Object.entries(v.escolhas).every(([id, valor]) => idValido(id) && texto(valor, 1000))))
    && (v.feitas === undefined || (Array.isArray(v.feitas) && v.feitas.every(idValido)));
}

export function lerNutricao(v: unknown): Nutricao {
  if (!objeto(v) || !objeto(v.planos) || !objeto(v.diario)) throw new Error('Nutrição inválida');
  const planos: Nutricao['planos'] = {};
  const diario: Nutricao['diario'] = {};
  for (const [data, plano] of Object.entries(v.planos)) {
    if (!dataValida(data) || !planoValido(plano)) throw new Error('Plano inválido');
    planos[data] = plano;
  }
  for (const [data, registro] of Object.entries(v.diario)) {
    if (!dataValida(data) || !registroValido(registro)) throw new Error('Registro inválido');
    diario[data] = registro;
  }
  return { planos, diario };
}

export function atualizarRegistro(diario: Nutricao['diario'], data: string, patch: Partial<Registro>) {
  const registro = { ...diario[data], ...patch };
  const atualizado = { ...diario };
  if (registro.altura || registro.cintura || registro.nota || registro.feitas?.length || registro.sono || registro.disposicao || Object.keys(registro.escolhas ?? {}).length) atualizado[data] = registro;
  else delete atualizado[data];
  return atualizado;
}
