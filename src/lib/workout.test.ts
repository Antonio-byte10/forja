import { describe, expect, it } from 'vitest';
import type { Plan, Session } from './types';
import {
  addSet, bestWeight, countSets, formatClock, lastSets, nextPlan, parseBackup, parseNumber,
  platesPerSide, removeSet, notasParaFicha, limparNotas, moveExercise, replaceExercise, restoPorLado, sugestaoDeCarga,
  logFromPlan, recordesDaSessao, semanasSeguidas, inicioDaSemana, evolucao, exerciciosFeitos, seriesPorGrupo, historicoCsv, e1rm, sessionVolume, setVolume, startSession, updateNote, updateSet, usaBarra, volumeChange,
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

  it('sugere D uma vez no fim de semana sem perder a posição de A/B/C', () => {
    const d = { ...plan('D'), fimDeSemana: true };
    const fichas = [...plans, d, { ...plan('F'), lugar: 'casa' as const }];
    const dia = (n: number, hora = 12) => new Date(2026, 10, n, hora);
    const historico = [session('B')];
    expect(nextPlan(fichas, historico, dia(20))?.id).toBe('C'); // sexta
    expect(nextPlan(fichas, historico, dia(21))?.id).toBe('D');
    expect(nextPlan(fichas, historico, dia(22))?.id).toBe('D');
    const sabado = { ...session('D'), startedAt: dia(21, 9).getTime() };
    for (const n of [21, 22, 23]) expect(nextPlan(fichas, [sabado, ...historico], dia(n))?.id).toBe('C');
    expect(nextPlan(fichas, [sabado, ...historico], dia(28))?.id).toBe('D');
    expect(nextPlan([d], [], dia(20))).toBeUndefined();
    expect(parseBackup(JSON.stringify({ plans: fichas, history: [] })).plans[3].fimDeSemana).toBe(true);
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
    expect(() => parseBackup('[]')).toThrow();
    expect(() => parseBackup('não é json')).toThrow();
  });

  it('parseBackup completa campos faltando e ignora lixo', () => {
    const { plans, history } = parseBackup(
      JSON.stringify({
        plans: [{ name: 'A', exercises: [{ name: 'Supino', sets: -2 }, 'lixo', null] }, 5],
        history: [{ id: 'x', planId: 'A', exercises: [{ name: 'Supino', sets: [{ weight: 40, reps: 10, done: true }, {}] }] }],
      }),
    );
    expect(plans).toHaveLength(1);
    expect(plans[0].exercises).toHaveLength(1);
    expect(plans[0].exercises[0]).toMatchObject({ name: 'Supino', sets: 3, reps: 10, weight: 0, unilateral: false });
    expect(history[0].exercises[0].sets).toEqual([
      { weight: 40, reps: 10, done: true },
      { weight: 0, reps: 0, done: false },
    ]);
  });

  it('parseBackup coloca o treino mais novo primeiro', () => {
    const { history } = parseBackup(
      JSON.stringify({ plans: [], history: [{ id: 'velho', startedAt: 1 }, { id: 'novo', startedAt: 9 }] }),
    );
    expect(history.map((s) => s.id)).toEqual(['novo', 'velho']);
  });

  it('volumeChange compara com o treino anterior da mesma ficha', () => {
    const feito = (id: string, planId: string, weight: number): Session => ({
      ...session(planId, [{ name: 'Supino', unilateral: false, sets: [{ weight, reps: 10, done: true }] }]),
      id,
    });
    const history = [feito('c', 'A', 110), feito('b', 'B', 500), feito('a', 'A', 100)];
    expect(volumeChange(history, history[0])).toBe(10);
    expect(volumeChange(history, history[1])).toBeUndefined();
    expect(volumeChange(history, history[2])).toBeUndefined();
  });

  it('platesPerSide calcula anilhas padrão por lado descontando a barra', () => {
    expect(platesPerSide(60)).toEqual([20]);
    expect(platesPerSide(55)).toEqual([15, 2.5]);
    expect(platesPerSide(20)).toEqual([]);
    expect(platesPerSide(15)).toEqual([]);
  });

  it('bestWeight considera apenas séries concluídas de carga', () => {
    const history = [
      session('A', [{ name: 'Supino', catalogKey: 'supino_reto', unilateral: false, sets: [
        { weight: 80, reps: 5, done: false },
        { weight: 65, reps: 8, done: true },
      ] }]),
      session('A', [{ name: 'Supino', catalogKey: 'supino_reto', unilateral: false, sets: [
        { weight: 70, reps: 6, done: true },
      ] }]),
    ];
    expect(bestWeight(history, 'supino_reto')).toBe(70);
    expect(bestWeight(history, 'agachamento')).toBe(0);
  });

  it('preserva descanso por exercício e anotação em logFromPlan, updateNote e parseBackup', () => {
    const comExtras = { ...supino, restSeconds: 120, note: 'banco 4' };
    const s0 = startSession(plan('A', [comExtras]), []);
    expect(s0.exercises[0]).toMatchObject({ restSeconds: 120, note: 'banco 4' });

    const editada = updateNote(s0, 0, 'pegada fechada');
    const history = [{ ...editada, finishedAt: 10 }];
    // Da ficha: vale a anotação da ficha (que é atualizada ao finalizar, ver notasParaFicha).
    expect(startSession(plan('A', [comExtras]), history).exercises[0].note).toBe('banco 4');
    expect(startSession(notasParaFicha(plan('A', [comExtras]), editada), history).exercises[0].note).toBe('pegada fechada');

    const volta = parseBackup(JSON.stringify({ plans: [plan('A', [comExtras])], history }));
    expect(volta.plans[0].exercises[0]).toMatchObject({ restSeconds: 120, note: 'banco 4' });
    expect(volta.history[0].exercises[0]).toMatchObject({ restSeconds: 120, note: 'pegada fechada' });
  });

  it('usaBarra diferencia barra livre de máquinas, polias e halteres', () => {
    expect(usaBarra({ name: 'Supino reto', catalogKey: 'supino_reto', unilateral: false })).toBe(true);
    expect(usaBarra({ name: 'Agachamento livre', catalogKey: 'agachamento', unilateral: false })).toBe(true);
    expect(usaBarra({ name: 'Supino com barra', unilateral: false })).toBe(true);
    expect(usaBarra({ name: 'Puxada frente aberta', catalogKey: 'puxada_frente', unilateral: false })).toBe(false);
    expect(usaBarra({ name: 'Leg press', catalogKey: 'leg_press', unilateral: false })).toBe(false);
    expect(usaBarra({ name: 'Cadeira extensora', catalogKey: 'cadeira_extensora', unilateral: false })).toBe(false);
    expect(usaBarra({ name: 'Supino com halteres', catalogKey: 'supino_halter', unilateral: true })).toBe(false);
    expect(usaBarra({ name: 'Supino no Smith', unilateral: false })).toBe(false);
  });

  it('restoPorLado avisa o que não fecha com as anilhas', () => {
    expect(restoPorLado(60)).toBe(0);
    expect(restoPorLado(57)).toBe(1);
    expect(restoPorLado(61)).toBe(0.5);
    expect(restoPorLado(15)).toBe(0);
  });

  it('limparNotas tira anotação vazia (evita texto solto que fecha o app no Android)', () => {
    const s0 = session('A', [{ name: 'Supino', unilateral: false, note: '   ', sets: [{ weight: 10, reps: 5, done: true }] }]);
    expect(limparNotas(s0).exercises[0]).not.toHaveProperty('note');
    const s1 = updateNote(s0, 0, '  banco 4 ');
    expect(limparNotas(s1).exercises[0].note).toBe('banco 4');
  });

  it('notasParaFicha leva a anotação do treino para a ficha e apaga quando o treino apagou', () => {
    const p = plan('A', [{ ...supino, note: 'velha' }]);
    const s0 = startSession(p, []);
    expect(notasParaFicha(p, updateNote(s0, 0, 'nova')).exercises[0].note).toBe('nova');
    expect(notasParaFicha(p, updateNote(s0, 0, '')).exercises[0]).not.toHaveProperty('note');
    expect(notasParaFicha(p, s0)).toBe(p);
  });

  it('sugestaoDeCarga sobe a carga quando bateu o topo da faixa em todas as séries', () => {
    const ex = { ...supino, sets: 3, reps: 8, repsMax: 12 };
    const bateu = [{ weight: 60, reps: 12, done: true }, { weight: 60, reps: 12, done: true }, { weight: 60, reps: 12, done: true }];
    expect(sugestaoDeCarga(ex, bateu)).toBe(2.5);
    expect(sugestaoDeCarga({ ...ex, unilateral: true }, bateu)).toBe(1);
    expect(sugestaoDeCarga(ex, [...bateu.slice(0, 2), { weight: 60, reps: 10, done: true }])).toBe(0);
    expect(sugestaoDeCarga(ex, bateu.slice(0, 2))).toBe(0);
    expect(sugestaoDeCarga(ex, undefined)).toBe(0);

    const history = [session('A', [{ name: ex.name, catalogKey: ex.catalogKey, unilateral: false, sets: bateu }])];
    const log = logFromPlan(ex, history, true);
    expect(log.progressao).toBe(2.5);
    expect(log.sets.every((x) => x.weight === 62.5 && x.reps === 8)).toBe(true);
  });

  it('moveExercise e replaceExercise mexem só na ordem e no item escolhido', () => {
    const s0 = startSession(plan('A', [supino, { ...supino, id: 'x', name: 'Remada', catalogKey: 'remada' }]), []);
    const movido = moveExercise(s0, 1, 0);
    expect(movido.exercises.map((e) => e.name)).toEqual(['Remada', s0.exercises[0].name]);
    expect(moveExercise(s0, 0, -1)).toBe(s0);
    const trocado = replaceExercise(s0, 0, { name: 'Supino máquina', unilateral: false, sets: [] });
    expect(trocado.exercises[0].name).toBe('Supino máquina');
    expect(trocado.exercises[1]).toBe(s0.exercises[1]);
  });

  it('recordes, evolução, exercícios feitos e séries por grupo', () => {
    const ex = (w: number, reps = 5) => [{ name: 'Supino', catalogKey: 'supino_reto', unilateral: false, sets: [{ weight: w, reps, done: true }] }];
    const antiga = { ...session('A', ex(60)), id: 'a', startedAt: 1000 };
    const nova = { ...session('A', ex(70)), id: 'b', startedAt: 2000 };
    const history = [nova, antiga];
    expect(recordesDaSessao(history, nova)).toEqual([{ name: 'Supino', antes: 60, agora: 70 }]);
    expect(recordesDaSessao(history, antiga)).toEqual([]);
    expect(evolucao(history, 'supino_reto').map((p) => p.carga)).toEqual([60, 70]);
    expect(e1rm(100, 1)).toBe(100);
    expect(Math.round(e1rm(100, 10))).toBe(133);
    expect(exerciciosFeitos(history)).toMatchObject([{ key: 'supino_reto', vezes: 2, recorde: 70, ultimo: 2000 }]);
    expect(seriesPorGrupo(history, 0, 3000, () => 'Peito')).toEqual([['Peito', 2]]);
    expect(seriesPorGrupo(history, 1500, 3000, () => 'Peito')).toEqual([['Peito', 1]]);
  });

  it('historicoCsv gera uma linha por série com vírgula decimal', () => {
    const s0 = { ...session('A', [{ name: 'Supino; reto', unilateral: false, note: 'banco 4', sets: [{ weight: 42.5, reps: 8, done: true }, { weight: 40, reps: 8, done: false }] }]), startedAt: new Date(2026, 10, 5, 7, 30).getTime() };
    const linhas = historicoCsv([s0]).split('\n');
    expect(linhas).toHaveLength(2);
    expect(linhas[1]).toBe('2026-11-05;07:30;Ficha A;"Supino; reto";1;42,5;8;;;banco 4');
  });

  it('semanasSeguidas conta semanas batendo a meta, sem punir a semana atual em andamento', () => {
    const agora = new Date(2026, 10, 19, 12).getTime(); // quinta
    const semana = (n: number, dia = 1) => {
      const d = new Date(inicioDaSemana(agora));
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7 * n + dia, 10).getTime();
    };
    const treino = (t: number) => ({ ...session('A'), id: String(t), startedAt: t });
    // 2 treinos nas 3 semanas anteriores, 1 nesta (meta 2).
    const h = [semana(0), semana(1), semana(1, 3), semana(2), semana(2, 3), semana(3), semana(3, 3)].map(treino);
    expect(semanasSeguidas(h, 2, agora)).toBe(3);
    expect(semanasSeguidas([...h, treino(semana(0, 2))], 2, agora)).toBe(4);
    // Semana passada sem a meta quebra a sequência.
    expect(semanasSeguidas(h.filter((s) => s.startedAt !== semana(1, 3)), 2, agora)).toBe(0);
    expect(semanasSeguidas([], 2, agora)).toBe(0);
  });

  it('parseBackup aceita peso corporal e ignora valores absurdos', () => {
    const b = parseBackup(JSON.stringify({ plans: [], history: [], pesos: [{ t: 2, kg: 80 }, { t: 1, kg: 81.5 }, { t: 3, kg: -1 }, { t: 'x', kg: 70 }] }));
    expect(b.pesos).toEqual([{ t: 1, kg: 81.5 }, { t: 2, kg: 80 }]);
    expect(parseBackup(JSON.stringify({ plans: [], history: [] }))).not.toHaveProperty('pesos');
  });
});

