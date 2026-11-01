import { describe, expect, it } from 'vitest';
import type { Plan, Session } from './types';
import {
  addSet, countSets, formatClock, lastSets, nextPlan, parseBackup, parseNumber,
  removeSet, sessionVolume, setVolume, startSession, updateSet,
} from './workout';

const plan = (id: string, exercises: Plan['exercises'] = []): Plan => ({ id, name: id, title: '', exercises });

const supino = { id: 'e1', name: 'Supino', catalogKey: 'supino_reto', sets: 3, reps: 10, weight: 40, unilateral: false };
const rosca = { id: 'e2', name: 'Rosca alternada', sets: 2, reps: 12, weight: 10, unilateral: true };

const session = (planId: string, exercises: Session['exercises'] = []): Session => ({
  id: planId, planId, planName: planId, planTitle: '', startedAt: 0, finishedAt: 1, exercises,
});

describe('volume', () => {
  it('conta só séries feitas', () => {
    expect(setVolume({ weight: 40, reps: 10, done: true }, false)).toBe(400);
    expect(setVolume({ weight: 40, reps: 10, done: false }, false)).toBe(0);
  });

  it('unilateral conta os dois lados', () => {
    expect(setVolume({ weight: 10, reps: 12, done: true }, true)).toBe(240);
  });

  it('soma o treino inteiro', () => {
    const s = session('A', [
      { name: 'Supino', unilateral: false, sets: [{ weight: 40, reps: 10, done: true }, { weight: 40, reps: 8, done: true }] },
      { name: 'Rosca', unilateral: true, sets: [{ weight: 10, reps: 10, done: true }, { weight: 10, reps: 10, done: false }] },
    ]);
    expect(sessionVolume(s)).toBe(400 + 320 + 200);
    expect(countSets(s)).toEqual({ done: 3, total: 4 });
  });
});

describe('startSession', () => {
  it('usa a carga da ficha quando não há histórico', () => {
    const s = startSession(plan('A', [supino, rosca]), []);
    expect(s.exercises[0].sets).toEqual(Array(3).fill({ weight: 40, reps: 10, done: false }));
    expect(s.exercises[1]).toMatchObject({ unilateral: true, sets: [{ weight: 10, reps: 12 }, { weight: 10, reps: 12 }] });
  });

  it('preenche com a última vez e repete a última série quando faltam séries', () => {
    const history = [
      session('A', [{ name: 'Supino', catalogKey: 'supino_reto', unilateral: false, sets: [
        { weight: 45, reps: 9, done: true }, { weight: 50, reps: 6, done: true }, { weight: 99, reps: 1, done: false },
      ] }]),
    ];
    const sets = startSession(plan('A', [supino]), history).exercises[0].sets;
    expect(sets.map((s) => [s.weight, s.reps])).toEqual([[45, 9], [50, 6], [50, 6]]);
  });

  it('ignora treinos em que o exercício não foi feito', () => {
    const history = [
      session('B', [{ name: 'Supino', catalogKey: 'supino_reto', unilateral: false, sets: [{ weight: 99, reps: 1, done: false }] }]),
      session('A', [{ name: 'Supino', catalogKey: 'supino_reto', unilateral: false, sets: [{ weight: 42.5, reps: 10, done: true }] }]),
    ];
    expect(lastSets(history, 'supino_reto')).toEqual([{ weight: 42.5, reps: 10, done: true }]);
  });
});

describe('séries', () => {
  const base = startSession(plan('A', [supino]), []);

  it('atualiza uma série sem mexer nas outras', () => {
    const s = updateSet(base, 0, 1, { weight: 50, done: true });
    expect(s.exercises[0].sets[1]).toEqual({ weight: 50, reps: 10, done: true });
    expect(s.exercises[0].sets[0]).toBe(base.exercises[0].sets[0]);
  });

  it('adiciona copiando a última e remove mantendo pelo menos uma', () => {
    expect(addSet(base, 0).exercises[0].sets).toHaveLength(4);
    let s = base;
    for (let i = 0; i < 5; i++) s = removeSet(s, 0);
    expect(s.exercises[0].sets).toHaveLength(1);
  });
});

describe('nextPlan', () => {
  const plans = [plan('A'), plan('B'), plan('C')];

  it('segue a sequência e volta ao começo', () => {
    expect(nextPlan(plans, [])?.id).toBe('A');
    expect(nextPlan(plans, [session('B')])?.id).toBe('C');
    expect(nextPlan(plans, [session('C')])?.id).toBe('A');
  });

  it('lida com ficha apagada e lista vazia', () => {
    expect(nextPlan(plans, [session('X')])?.id).toBe('A');
    expect(nextPlan([], [])).toBeUndefined();
  });
});

describe('utilitários', () => {
  it('parseNumber aceita vírgula e rejeita lixo', () => {
    expect(parseNumber('42,5')).toBe(42.5);
    expect(parseNumber('abc')).toBe(0);
    expect(parseNumber('-3')).toBe(0);
  });

  it('formatClock', () => {
    expect(formatClock(90_000)).toBe('1:30');
    expect(formatClock(-5)).toBe('0:00');
  });

  it('parseBackup valida o formato', () => {
    expect(parseBackup('{"plans":[],"history":[]}')).toEqual({ plans: [], history: [] });
    expect(() => parseBackup('{"x":1}')).toThrow();
    expect(() => parseBackup('não é json')).toThrow();
  });
});
