import { describe, expect, it } from 'vitest';
import { animacoes } from '../data/animacoes';
import { caixa, desenhar, duracao, poseEm, resolver, type Animacao } from './boneco';

const todas = Object.entries(animacoes) as [string, Animacao][];

describe('boneco', () => {
  it('toda animação resolve sem número inválido, em qualquer instante', () => {
    for (const [nome, anim] of todas) {
      for (let t = 0; t < duracao(anim); t += 0.21) {
        const { formas, sombra } = desenhar(anim, poseEm(anim, t));
        expect(formas.length, nome).toBeGreaterThan(10);
        expect(formas.map((f) => f.d + f.g.join()).join(''), nome).not.toMatch(/NaN|Infinity/);
        expect(Number.isFinite(sombra.cx + sombra.rx), nome).toBe(true);
      }
    }
  });

  it('ninguém afunda no chão: nenhuma articulação fica abaixo de y = 0', () => {
    for (const [nome, anim] of todas) {
      for (const { pose } of anim.poses) {
        const E = resolver(pose);
        const ys = [E.pelve, E.cabeca, E.bracoN.j2, E.bracoF.j2, E.pernaN.j2, E.pernaF.j2, E.pernaN.j1, E.pernaF.j1].map((p) => p[1]);
        expect(Math.min(...ys), nome).toBeGreaterThanOrEqual(-0.5);
      }
    }
  });

  it('na flexão as mãos ficam paradas no chão enquanto o corpo desce', () => {
    const [alto, baixo] = animacoes.flexao.poses.map((q) => resolver(q.pose));
    expect(alto.bracoN.j2[0]).toBeCloseTo(baixo.bracoN.j2[0], 0);
    expect(alto.bracoN.j2[1]).toBeCloseTo(3, 0);
    expect(baixo.pescoco[1]).toBeLessThan(alto.pescoco[1] - 20);
  });

  it('a animação dá a volta: o fim emenda no começo', () => {
    const a = animacoes.abdominal;
    expect(poseEm(a, duracao(a) + 0.4).coluna).toBeCloseTo(poseEm(a, 0.4).coluna!, 5);
  });

  it('a caixa é 3:2, como as fotos', () => {
    for (const [nome, anim] of todas) {
      const c = caixa(anim);
      expect(c.w / c.h, nome).toBeCloseTo(1.5, 1);
    }
  });
});
