import { describe, expect, it } from 'vitest';
import type { Plan, Session } from './types';
import {
  addExercise, addSet, formatSet, insertSession, logFromPlan, newActivity, nextPlan, pace, parseBackup, resumo,
  sessionMeters, sessionMinutes, sessionReps, sessionSeconds, sessionVolume, startFree, startSession, totals,
  volumeChange, volumeChanges,
} from './workout';

const plan = (id: string, exercises: Plan['exercises'] = []): Plan => ({ id, name: id, title: '', exercises });
const session = (planId: string, exercises: Session['exercises'] = []): Session => ({
  id: planId, planId, planName: planId, planTitle: '', startedAt: 0, finishedAt: 1, exercises,
});

const supino = { id: 'e1', name: 'Supino', catalogKey: 'supino_reto', sets: 3, reps: 10, weight: 40, unilateral: false };
const flexao = { id: 'f', name: 'Flexão', catalogKey: 'flexao', medida: 'reps' as const, sets: 2, reps: 10, weight: 0, unilateral: false };
const prancha = { id: 'p', name: 'Prancha', catalogKey: 'prancha', medida: 'tempo' as const, sets: 2, reps: 0, seconds: 40, weight: 0, unilateral: false };
const corrida = { id: 'c', name: 'Corrida', medida: 'cardio' as const, sets: 1, reps: 0, seconds: 1800, meters: 5000, weight: 0, unilateral: false };

/** Treino de casa com tudo feito, durando 45 min. */
const casa = (): Session => {
  const s0 = startSession({ ...plan('F', [flexao, prancha, corrida]), lugar: 'casa' }, [], 0);
  return { ...s0, finishedAt: 45 * 60_000, exercises: s0.exercises.map((e) => ({ ...e, sets: e.sets.map((x) => ({ ...x, done: true })) })) };
};

describe('peso do corpo, tempo e cardio', () => {
  it('a série nasce com a medida certa', () => {
    const s0 = startSession(plan('F', [flexao, prancha, corrida]), [], 0);
    expect(s0.exercises[0].sets[0]).toEqual({ weight: 0, reps: 10, done: false });
    expect(s0.exercises[0].medida).toBe('reps');
    expect(s0.exercises[1].sets[0].seconds).toBe(40);
    expect(s0.exercises[2].sets[0]).toMatchObject({ seconds: 1800, meters: 5000 });
  });

  it('soma repetições, tempo e distância em vez de volume em kg', () => {
    const s1 = casa();
    expect(sessionVolume(s1)).toBe(0);
    expect(sessionReps(s1)).toBe(20);
    expect(sessionSeconds(s1)).toBe(80 + 1800);
    expect(sessionMeters(s1)).toBe(5000);
    expect(sessionMinutes(s1)).toBe(45);
  });

  it('o resumo escolhe a unidade que faz sentido', () => {
    expect(resumo(casa())).toEqual({ valor: '5', unidade: 'km' });
    expect(resumo({ ...casa(), exercises: casa().exercises.slice(0, 1) })).toEqual({ valor: '20', unidade: 'reps' });
    const musculacao = session('A', [{ name: 'Supino', unilateral: false, sets: [{ weight: 40, reps: 10, done: true }] }]);
    expect(resumo(musculacao)).toEqual({ valor: '400', unidade: 'kg' });
  });

  it('formata a série conforme a medida', () => {
    expect(formatSet({ weight: 40, reps: 10, done: true })).toBe('40×10');
    expect(formatSet({ weight: 0, reps: 12, done: true }, 'reps')).toBe('12');
    expect(formatSet({ weight: 0, reps: 0, seconds: 45, done: true }, 'tempo')).toBe('45 s');
    expect(formatSet({ weight: 0, reps: 0, seconds: 1680, meters: 5000, done: true }, 'cardio')).toBe('28 min · 5 km');
  });

  it('repete o tempo da última vez', () => {
    const antes = casa();
    antes.exercises[1].sets[0].seconds = 55;
    expect(logFromPlan(prancha, [antes]).sets[0].seconds).toBe(55);
  });

  it('nova série por tempo copia os segundos da anterior', () => {
    const s0 = startSession(plan('F', [prancha]), [], 0);
    expect(addSet(s0, 0).exercises[0].sets[2]).toEqual({ weight: 0, reps: 0, seconds: 40, done: false });
  });
});

describe('treino livre e atividades', () => {
  it('treino livre começa vazio e recebe exercícios', () => {
    const livre = startFree(0);
    expect(livre.tipo).toBe('livre');
    const com = addExercise(livre, logFromPlan(supino, []));
    expect(com.exercises).toHaveLength(1);
    expect(com.exercises[0].sets).toHaveLength(3);
  });

  it('atividade guarda duração, distância e ritmo', () => {
    const a = newActivity({ nome: 'Corrida', inicio: 1_000_000, minutos: 28, metros: 5000, intensidade: 'forte', nota: ' parque ' });
    expect(a).toMatchObject({ tipo: 'atividade', planTitle: 'Corrida', distanciaM: 5000, intensidade: 'forte', nota: 'parque' });
    expect(sessionMinutes(a)).toBe(28);
    expect(resumo(a)).toEqual({ valor: '5', unidade: 'km' });
    expect(pace(28, 5000)).toBe('5:36');
    expect(pace(30, 0)).toBeUndefined();
    expect(resumo(newActivity({ nome: 'Futebol', inicio: 0, minutos: 60 }))).toEqual({ valor: '60', unidade: 'min' });
  });

  it('lançar um treino de ontem mantém o histórico do mais novo para o mais antigo', () => {
    const hoje = { ...session('A'), id: 'hoje', startedAt: 2000 };
    const antigo = { ...session('B'), id: 'antigo', startedAt: 500 };
    const ontem = newActivity({ nome: 'Corrida', inicio: 1000, minutos: 30 });
    expect(insertSession([hoje, antigo], ontem).map((x) => x.startedAt)).toEqual([2000, 1000, 500]);
  });

  it('dois treinos no mesmo dia contam como dois, com os minutos somados', () => {
    const manha = { ...session('A'), id: 'm', startedAt: 1000, finishedAt: 1000 + 50 * 60_000 };
    const tarde = newActivity({ nome: 'Corrida', inicio: 5_000_000, minutos: 30, metros: 4000 });
    expect(totals([tarde, manha], 0, 86_400_000)).toEqual({ sessions: 2, minutes: 80, meters: 4000 });
  });

  it('ficha de casa, treino livre e atividade não mexem na sequência da academia', () => {
    const plans = [plan('A'), plan('B'), plan('C'), { ...plan('F'), lugar: 'casa' as const }];
    const corridaHoje = newActivity({ nome: 'Corrida', inicio: 9, minutos: 30 });
    expect(nextPlan(plans, [corridaHoje, session('F'), startFree(5), session('A')])?.id).toBe('B');
    expect(nextPlan(plans, [session('C')])?.id).toBe('A');
    expect(nextPlan([{ ...plan('F'), lugar: 'casa' as const }], [])).toBeUndefined();
  });

  it('volumeChanges dá o mesmo resultado que volumeChange, de uma vez', () => {
    const feito = (id: string, planId: string, kg: number): Session => ({
      ...session(planId, [{ name: 'Supino', unilateral: false, sets: [{ weight: kg, reps: 10, done: true }] }]), id,
    });
    const history = [feito('4', 'A', 55), newActivity({ nome: 'Corrida', inicio: 3, minutos: 20 }), feito('3', 'B', 30), feito('2', 'A', 50), feito('1', 'A', 40)];
    const todos = volumeChanges(history);
    for (const s of history) expect(todos.get(s.id), s.id).toBe(volumeChange(history, s));
    expect(todos.get('4')).toBe(10);
  });

  it('backup guarda e devolve os campos novos', () => {
    const fichaCasa = { ...plan('F', [prancha]), lugar: 'casa' as const };
    const a = newActivity({ nome: 'Corrida', inicio: 1000, minutos: 28, metros: 5000, intensidade: 'leve', nota: 'ok' });
    const treino = { ...startSession(fichaCasa, [], 500), finishedAt: 900 };
    const volta = parseBackup(JSON.stringify({ plans: [fichaCasa], history: [a, treino] }));
    expect(volta.plans[0]).toMatchObject({ lugar: 'casa', exercises: [{ medida: 'tempo', seconds: 40 }] });
    expect(volta.history[0]).toMatchObject({ tipo: 'atividade', distanciaM: 5000, intensidade: 'leve', nota: 'ok' });
    expect(volta.history[1]).toMatchObject({ lugar: 'casa', exercises: [{ medida: 'tempo', sets: [{ seconds: 40 }, { seconds: 40 }] }] });
  });
});
