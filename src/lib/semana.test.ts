import { describe, expect, it } from 'vitest';
import { gastoDiario, niveis, perfilValido, resumoSeteDias, type Perfil } from './semana';
import { parseBackup } from './workout';

describe('estimativa de gasto energético', () => {
  const perfil: Perfil = { peso: 70, altura: 170, idade: 30, sexo: 'Feminino', atividade: 'Inativa' };
  it('aplica as oito equações DRI e arredonda às dezenas', () => {
    expect(niveis.map((atividade) => gastoDiario({ ...perfil, atividade }))).toEqual([2170, 2340, 2480, 2720]);
    expect(niveis.map((atividade) => gastoDiario({ ...perfil, sexo: 'Masculino', atividade }))).toEqual([2520, 2710, 2900, 3150]);
  });
  it('valida o perfil e mantém compatibilidade com backups anteriores', () => {
    const backup = { plans: [], history: [] };
    expect(parseBackup(JSON.stringify(backup))).toEqual(backup);
    const novo = { ...backup, perfil, agenda: { '2026-11-21': 'A' } };
    expect(parseBackup(JSON.stringify(novo))).toEqual(novo);
    expect(() => parseBackup(JSON.stringify({ ...novo, agenda: { '2026-02-31': 'A' } }))).toThrow();
    expect(perfilValido({ ...perfil, idade: 18 })).toBe(false);
    expect(perfilValido({ ...perfil, peso: Infinity })).toBe(false);
  });
});
it('calcula a janela entre meses e faz média apenas das noites registradas', () => {
  const sessao = (dia: string) => ({
    id: dia, planId: 'A', planName: 'A', planTitle: 'Força', exercises: [],
    startedAt: new Date(dia + 'T10:00:00').getTime(), finishedAt: new Date(dia + 'T10:30:00').getTime(),
  });
  const resumo = resumoSeteDias('2026-11-02', ['2026-10-26', '2026-10-27', '2026-11-02', '2026-11-03'].map(sessao), {
    '2026-10-27': { feitas: ['cafe'], sono: { minutos: 420, fonte: 'manual' } },
    '2026-11-01': { sono: { minutos: 480, fonte: 'manual' } },
  });
  expect(resumo).toMatchObject({ minutos: 60, treinos: 2, noites: 2, sonoMedio: 450, refeicoes: 1 });
});
