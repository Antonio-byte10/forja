import { describe, expect, it } from 'vitest';
import { atualizarRegistro, dataLocal, dataValida, meioDia, planoEm, refeicoesEm, type PlanoAlimentar } from './nutricao';
import { parseBackup } from './workout';

const plano: PlanoAlimentar = { orientacoes: 'Conferir alternativas', refeicoes: [
  { id: 'a', nome: 'Almoço', horario: '', alimentos: 'Porção conforme plano', dias: [] },
  { id: 'b', nome: 'Lanche', horario: '15h', alimentos: 'Fruta', dias: [1] },
] };
describe('Plano e diário por data local', () => {
  it('mantém o plano vigente de cada dia sem aplicar alterações retroativamente', () => {
    const planos = { '2026-11-10': plano, '2026-12-01': { ...plano, orientacoes: 'Outra versão' } };
    expect(planoEm(planos, '2026-11-09')).toBeUndefined();
    expect(planoEm(planos, '2026-11-30')).toBe(plano);
    expect(planoEm(planos, '2026-12-01')).toBe(planos['2026-12-01']);
  });
  it('combina refeições diárias e específicas do dia da semana', () => {
    expect(refeicoesEm(plano, '2026-11-16')).toHaveLength(2);
    expect(refeicoesEm(plano, '2026-11-17')).toHaveLength(1);
  });
  it('rejeita datas normalizadas pelo JavaScript', () => {
    expect(dataValida('2026-02-30')).toBe(false);
    expect(dataLocal(meioDia('2028-02-29'))).toBe('2028-02-29');
  });
  it('preserva o checklist ao editar notas e remove dias que ficaram vazios', () => {
    const dia = '2026-11-20';
    const diario = atualizarRegistro({ [dia]: { feitas: ['a'] } }, dia, { nota: 'Dia tranquilo' });
    expect(diario[dia].feitas).toEqual(['a']);
    expect(atualizarRegistro(diario, dia, { feitas: [], nota: undefined })).toEqual({});
  });
  it('restaura a nutrição e aceita arquivos anteriores à nova aba', () => {
    const base = { plans: [], history: [] };
    const nutricao = { planos: { '2026-11-01': plano }, diario: { '2026-11-30': { altura: 170, nota: 'OK', feitas: ['b'] } } };
    expect(parseBackup(JSON.stringify({ ...base, nutricao })).nutricao).toEqual(nutricao);
    expect(parseBackup(JSON.stringify(base)).nutricao).toBeUndefined();
  });
  it('rejeita plano incompleto e medidas inválidas antes de restaurar', () => {
    for (const nutricao of [
      { planos: { '2026-11-20': { ...plano, refeicoes: [{ nome: 'sem alimentos' }] } }, diario: {} },
      { planos: {}, diario: { '2026-11-20': { altura: -1 } } },
    ]) expect(() => parseBackup(JSON.stringify({ plans: [], history: [], nutricao }))).toThrow();
  });
});
