import { describe, expect, it } from 'vitest';
import { htmlConsulta, resumoConsulta } from './consulta';
import { atualizarRegistro, lerNutricao, meioDia, type Nutricao } from './nutricao';

const dia = '2026-11-20';
const dados: Nutricao = { planos: { [dia]: { orientacoes: '', refeicoes: [{
  id: 'r', nome: 'Lanche', horario: '', alimentos: 'Pera ou maçã', dias: [], alternativas: ['Pera', 'Maçã'], pagina: 2,
}] } }, diario: { [dia]: { feitas: ['r'], escolhas: { r: 'Maçã' }, nota: 'pessoal <&>', cintura: 82, sono: { minutos: 450, fonte: 'manual' }, disposicao: 'Boa' } } };
const pesos = [{ t: meioDia('2026-11-18').getTime(), kg: 82 }, { t: meioDia(dia).getTime(), kg: 81.5 }];

describe('Diário, consulta e compatibilidade do backup', () => {
  it('preserva escolhas, fonte, disposição e página ao restaurar', () => {
    expect(lerNutricao(JSON.parse(JSON.stringify(dados)))).toEqual(dados);
    expect(lerNutricao({ planos: {}, diario: { [dia]: { nota: 'antigo' } } }).diario[dia].nota).toBe('antigo');
  });
  it('preserva um dia com apenas sono após limpar uma nota', () => {
    const sono = { minutos: 410, fonte: 'Health Connect' as const };
    expect(atualizarRegistro({ [dia]: { sono, nota: 'x' } }, dia, { nota: undefined })[dia].sono).toEqual(sono);
  });
  it('aplica o período, soma refeições e omite notas e fotos por padrão', () => {
    const res = resumoConsulta('2026-11-18', dia, dados, pesos, false);
    expect(res).toMatchObject({ pesagens: 2, total: 1, delta: -0.5 });
    const html = htmlConsulta('2026-11-18', dia, res, []);
    expect(html).toContain('Maçã');
    expect(html).not.toContain('pessoal');
    expect(html).not.toContain('<img ');
    expect(resumoConsulta(dia, dia, dados, pesos, true).delta).toBeUndefined();
    expect(htmlConsulta(dia, dia, resumoConsulta(dia, dia, dados, pesos, true), [])).toContain('pessoal &lt;&amp;&gt;');
  });
});
