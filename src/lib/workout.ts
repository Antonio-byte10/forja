import type { Backup, ExerciseLog, Plan, Session, SetLog } from './types';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Aceita "42,5" ou "42.5"; qualquer coisa inválida ou negativa vira 0. */
export const parseNumber = (text: string) => {
  const n = Number.parseFloat(text.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export const formatKg = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

export const formatClock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** Identifica o mesmo exercício entre fichas diferentes. */
export const exerciseKey = (e: { catalogKey?: string; name: string }) => e.catalogKey ?? e.name;

/** Unilateral: a carga é por lado, então o volume conta os dois lados. */
export const setVolume = ({ weight, reps, done }: SetLog, unilateral: boolean) =>
  done ? weight * reps * (unilateral ? 2 : 1) : 0;

export const exerciseVolume = (e: ExerciseLog) =>
  e.sets.reduce((sum, s) => sum + setVolume(s, e.unilateral), 0);

export const sessionVolume = (s: Session) => s.exercises.reduce((sum, e) => sum + exerciseVolume(e), 0);

export const countSets = (s: Session) => {
  const sets = s.exercises.flatMap((e) => e.sets);
  return { done: sets.filter((x) => x.done).length, total: sets.length };
};

/** Séries feitas da última vez nesse exercício (histórico em ordem do mais novo). */
export const lastSets = (history: Session[], key: string): SetLog[] | undefined =>
  history
    .flatMap((s) => s.exercises)
    .filter((e) => exerciseKey(e) === key)
    .map((e) => e.sets.filter((s) => s.done))
    .find((sets) => sets.length > 0);

export const summarizeSets = (sets: SetLog[]) =>
  sets.map((s) => `${formatKg(s.weight)}×${s.reps}`).join(' · ');

/** Cria o treino a partir da ficha, já preenchido com as cargas da última vez. */
export const startSession = (plan: Plan, history: Session[], now = Date.now()): Session => ({
  id: uid(),
  planId: plan.id,
  planName: plan.name,
  planTitle: plan.title,
  startedAt: now,
  exercises: plan.exercises.map((ex) => {
    const last = lastSets(history, exerciseKey(ex));
    const sets = Array.from({ length: ex.sets }, (_, i) => {
      const prev = last?.[Math.min(i, last.length - 1)];
      return { weight: prev?.weight ?? ex.weight, reps: prev?.reps ?? ex.reps, done: false };
    });
    return { name: ex.name, catalogKey: ex.catalogKey, unilateral: ex.unilateral, sets };
  }),
});

const mapExercise = (s: Session, index: number, fn: (e: ExerciseLog) => ExerciseLog): Session => ({
  ...s,
  exercises: s.exercises.map((e, i) => (i === index ? fn(e) : e)),
});

export const updateSet = (s: Session, ex: number, set: number, patch: Partial<SetLog>) =>
  mapExercise(s, ex, (e) => ({ ...e, sets: e.sets.map((x, i) => (i === set ? { ...x, ...patch } : x)) }));

export const addSet = (s: Session, ex: number) =>
  mapExercise(s, ex, (e) => {
    const last = e.sets.at(-1);
    return { ...e, sets: [...e.sets, { weight: last?.weight ?? 0, reps: last?.reps ?? 0, done: false }] };
  });

/** Remove a última série, mantendo pelo menos uma. */
export const removeSet = (s: Session, ex: number) =>
  mapExercise(s, ex, (e) => (e.sets.length > 1 ? { ...e, sets: e.sets.slice(0, -1) } : e));

/** Próxima ficha na sequência A → B → C → A, a partir do último treino. */
export const nextPlan = (plans: Plan[], history: Session[]): Plan | undefined => {
  const i = plans.findIndex((p) => p.id === history[0]?.planId);
  return plans[(i + 1) % plans.length];
};

export const dayKey = (t: number | Date) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** Variação (%) do volume em relação ao treino anterior da mesma ficha; `undefined` se não houver base. */
export const volumeChange = (history: Session[], session: Session): number | undefined => {
  const i = history.findIndex((s) => s.id === session.id);
  const previous = i < 0 ? undefined : history.slice(i + 1).find((s) => s.planId === session.planId);
  const before = previous ? sessionVolume(previous) : 0;
  return before > 0 ? Math.round((sessionVolume(session) / before - 1) * 100) : undefined;
};

type Raw = Record<string, unknown>;
const isRaw = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const rawList = (v: unknown): Raw[] => (Array.isArray(v) ? v.filter(isRaw) : []);
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const count = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback);

/** Um backup colado à mão pode estar incompleto: completa o que falta em vez de travar o app. */
const cleanPlan = (p: Raw): Plan => ({
  id: str(p.id) || uid(),
  name: str(p.name, '?'),
  title: str(p.title),
  exercises: rawList(p.exercises).map((e) => ({
    id: str(e.id) || uid(),
    name: str(e.name, 'Exercício'),
    catalogKey: typeof e.catalogKey === 'string' ? e.catalogKey : undefined,
    sets: Math.round(count(e.sets, 3)),
    reps: Math.round(count(e.reps, 10)),
    weight: count(e.weight, 0),
    unilateral: e.unilateral === true,
  })),
});

const cleanSession = (s: Raw): Session => ({
  id: str(s.id) || uid(),
  planId: str(s.planId),
  planName: str(s.planName, '?'),
  planTitle: str(s.planTitle),
  startedAt: count(s.startedAt, 0),
  finishedAt: typeof s.finishedAt === 'number' ? s.finishedAt : undefined,
  exercises: rawList(s.exercises).map((e) => ({
    name: str(e.name, 'Exercício'),
    catalogKey: typeof e.catalogKey === 'string' ? e.catalogKey : undefined,
    unilateral: e.unilateral === true,
    sets: rawList(e.sets).map((x) => ({ weight: count(x.weight, 0), reps: count(x.reps, 0), done: x.done === true })),
  })),
});

export const parseBackup = (input: string): Backup => {
  const data: unknown = JSON.parse(input);
  if (!isRaw(data) || !Array.isArray(data.plans) || !Array.isArray(data.history)) throw new Error('Backup inválido');
  return {
    plans: rawList(data.plans).map(cleanPlan),
    // Mais novo primeiro, como o app espera.
    history: rawList(data.history).map(cleanSession).sort((a, b) => b.startedAt - a.startedAt),
  };
};
