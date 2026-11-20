/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { animacoes } from './animacoes';

// catalog.ts faz require() de imagens, que o vitest não carrega; por isso o teste lê o texto.
const read = (file: string) => readFileSync(join(__dirname, file), 'utf-8');
const linhas = (read('catalog.ts') + read('catalogExtra.ts')).split('\n').filter((l) => /^ {2}\w+: \{ name:/.test(l));
const catalogKeys = linhas.map((l) => l.match(/^ {2}(\w+):/)![1]);

describe('catálogo', () => {
  it('tem muitos exercícios, sem chave repetida', () => {
    expect(catalogKeys.length).toBeGreaterThanOrEqual(240);
    expect(new Set(catalogKeys).size).toBe(catalogKeys.length);
  });

  it('cada exercício tem a foto com o próprio nome ou, sem foto, um boneco', () => {
    for (const linha of linhas) {
      const key = linha.match(/^ {2}(\w+):/)![1];
      const fotos = [...linha.matchAll(/exercises\/(\w+)\.jpg/g)].map((m) => m[1]);
      if (!fotos.length) expect(linha, key).toMatch(/anim: '\w+'/);
      else expect(fotos, key).toEqual(fotos.length === 2 ? [key, `${key}_2`] : [key]);
      for (const file of fotos) expect(existsSync(join(__dirname, '../../assets/exercises', `${file}.jpg`)), file).toBe(true);
    }
  });

  it('todo boneco citado no catálogo existe', () => {
    const usados = [...(read('catalog.ts') + read('catalogExtra.ts')).matchAll(/anim: '(\w+)'/g)].map((m) => m[1]);
    expect(usados.length).toBeGreaterThan(15);
    for (const a of usados) expect(Object.keys(animacoes), a).toContain(a);
  });

  it('fichas padrão da academia e de casa usam exercícios do catálogo', () => {
    const plans = read('defaults.ts').split("id: '").slice(1);
    expect(plans).toHaveLength(5);
    const casa = plans.find((p) => p.includes("lugar: 'casa'"))!;
    for (const plan of plans) {
      const keys = [...plan.matchAll(/\['(\w+)', \d+/g)].map((m) => m[1]);
      for (const key of keys) expect(catalogKeys, key).toContain(key);
      if (plan === casa) continue;
      if (plan.startsWith("D'")) {
        expect(plan).toContain('fimDeSemana: true');
        expect(keys.length).toBeGreaterThan(5);
        continue;
      }
      expect(keys.length).toBeGreaterThanOrEqual(4);
      expect(keys.length).toBeLessThanOrEqual(5);
    }
    // A ficha de casa é a de flexão e abdômen, sem saltos.
    const keys = [...casa.matchAll(/\['(\w+)', \d+/g)].map((m) => m[1]);
    expect(keys.filter((k) => k.startsWith('flexao')).length).toBeGreaterThanOrEqual(6);
    expect(keys.join(' ')).not.toMatch(/salto|polichinelo|burpee/);
  });
});
