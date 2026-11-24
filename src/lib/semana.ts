import type { Nutricao } from './nutricao';
import type { Session } from './types';
import { dataLocal, dataValida, deslocarDia } from './datas';

export type Agenda = Record<string, string>;
export const niveis = ['Inativa', 'Pouco ativa', 'Ativa', 'Muito ativa'] as const;
export type Perfil = {
  sexo: 'Feminino' | 'Masculino';
  idade: number;
  altura: number;
  peso: number;
  atividade: typeof niveis[number];
};

export function perfilValido(value: unknown): value is Perfil {
  if (!value || typeof value !== 'object') return false;
  const p = value as Partial<Perfil>;
  return (p.sexo === 'Feminino' || p.sexo === 'Masculino')
    && typeof p.idade === 'number' && Number.isInteger(p.idade) && p.idade >= 19 && p.idade <= 120
    && typeof p.altura === 'number' && p.altura >= 80 && p.altura <= 250
    && typeof p.peso === 'number' && p.peso >= 20 && p.peso < 500
    && niveis.some((nivel) => nivel === p.atividade);
}

// DRI 2023, adultos de 19 anos ou mais. Intercepto, idade, altura em cm, peso em kg.
const coeficientes = {
  Feminino: [[584.90, -7.01, 5.72, 11.71], [575.77, -7.01, 6.60, 12.14], [710.25, -7.01, 6.54, 12.34], [511.83, -7.01, 9.07, 12.56]],
  Masculino: [[753.07, -10.83, 6.50, 14.10], [581.47, -10.83, 8.30, 14.94], [1004.82, -10.83, 6.52, 15.91], [-517.88, -10.83, 15.61, 19.11]],
};
export function gastoDiario(p: Perfil) {
  const [base, idade, altura, peso] = coeficientes[p.sexo][niveis.indexOf(p.atividade)];
  return Math.round((base + idade * p.idade + altura * p.altura + peso * p.peso) / 10) * 10;
}

export function lerAgenda(value: unknown): Agenda {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Agenda inválida');
  const entradas = Object.entries(value);
  if (entradas.some(([dia, ficha]) => !dataValida(dia) || typeof ficha !== 'string' || !ficha.trim())) throw new Error('Agendamento inválido');
  return Object.fromEntries(entradas);
}

export function fichaConcluida(history: Session[], dia: string, id?: string) {
  return !!id && history.some((s) => s.planId === id && dataLocal(s.startedAt) === dia);
}

export function resumoSeteDias(hoje: string, history: Session[], diario: Nutricao['diario']) {
  const dias = Array.from({ length: 7 }, (_, i) => {
    const dia = deslocarDia(hoje, i - 6);
    return { dia, treinos: 0, minutos: 0, sono: diario[dia]?.sono?.minutos, refeicoes: diario[dia]?.feitas?.length ?? 0 };
  });
  const porData = new Map(dias.map((d) => [d.dia, d]));
  for (const sessao of history) {
    const d = porData.get(dataLocal(sessao.startedAt));
    if (d) {
      d.treinos++;
      d.minutos += Math.max(0, ((sessao.finishedAt ?? sessao.startedAt) - sessao.startedAt) / 60000);
    }
  }
  const noites = dias.filter((d) => d.sono !== undefined);
  return {
    dias, treinos: dias.reduce((s, d) => s + d.treinos, 0),
    minutos: Math.round(dias.reduce((s, d) => s + d.minutos, 0)),
    refeicoes: dias.reduce((s, d) => s + d.refeicoes, 0),
    noites: noites.length,
    sonoMedio: noites.length ? Math.round(noites.reduce((s, d) => s + (d.sono ?? 0), 0) / noites.length) : undefined,
  };
}
