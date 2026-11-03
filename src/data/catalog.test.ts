/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// catalog.ts faz require() de imagens, que o vitest não carrega; por isso o teste lê o texto.
const read = (file: string) => readFileSync(join(__dirname, file), 'utf-8');
const catalogKeys = [...read('catalog.ts').matchAll(/^ {2}(\w+): \{ name:/gm)].map((m) => m[1]);

describe('catálogo', () => {
  it('tem muitos exercícios, sem chave repetida', () => {
    expect(catalogKeys.length).toBeGreaterThanOrEqual(150);
    expect(new Set(catalogKeys).size).toBe(catalogKeys.length);
  });

  it('cada exercício tem a foto com o próprio nome', () => {
    const images = [...read('catalog.ts').matchAll(/^ {2}(\w+): .*exercises\/(\w+)\.jpg/gm)];
    expect(images).toHaveLength(catalogKeys.length);
    for (const [, key, file] of images) {
      expect(file).toBe(key);
      expect(existsSync(join(__dirname, '../../assets/exercises', `${file}.jpg`)), file).toBe(true);
    }
  });

  it('fichas padrão: 3 fichas curtas com exercícios do catálogo', () => {
    const plans = read('defaults.ts').split("id: '").slice(1);
    expect(plans).toHaveLength(3);
    for (const plan of plans) {
      const keys = [...plan.matchAll(/\['(\w+)', \d+/g)].map((m) => m[1]);
      expect(keys.length).toBeGreaterThanOrEqual(4);
      expect(keys.length).toBeLessThanOrEqual(5);
      for (const key of keys) expect(catalogKeys).toContain(key);
    }
  });
});
