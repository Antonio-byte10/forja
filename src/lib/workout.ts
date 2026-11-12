import type { Backup, ExerciseLog, Intensidade, Lugar, Medida, Plan, PlanExercise, Session, SetLog } from './types';

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

export const formatKm = (m: number) => (m / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
export const formatSeconds = (sec: number) => (sec < 90 ? `${Math.round(sec)} s` : `${formatClock(sec * 1000)} min`);

/** Identifica o mesmo exercício entre fichas diferentes. */
export const exerciseKey = (e: { catalogKey?: string; name: string }) => e.catalogKey ?? e.name;

export const medidaDe = (e: { medida?: Medida }): Medida => e.medida ?? 'carga';
export const porTempo = (m: Medida) => m === 'tempo' || m === 'cardio' || m === 'alongamento';

/** Unilateral: a carga é por lado, então o volume conta os dois lados. */
export const setVolume = ({ weight, reps, done }: SetLog, unilateral: boolean) =>
  done ? weight * reps * (unilateral ? 2 : 1) : 0;

/** Volume em kg: só exercícios medidos por carga entram na conta. */
export const exerciseVolume = (e: ExerciseLog) =>
  medidaDe(e) === 'carga' ? e.sets.reduce((sum, s) => sum + setVolume(s, e.unilateral), 0) : 0;

export const sessionVolume = (s: Session) => s.exercises.reduce((sum, e) => sum + exerciseVolume(e), 0);

const feitas = (e: ExerciseLog) => e.sets.filter((x) => x.done);

/** Repetições feitas nos exercícios de peso do corpo. */
export const sessionReps = (s: Session) =>
  s.exercises.reduce((sum, e) => sum + (medidaDe(e) === 'reps' ? feitas(e).reduce((n, x) => n + x.reps, 0) : 0), 0);

/** Segundos somados nos exercícios por tempo (prancha, corrida, alongamento). */
export const sessionSeconds = (s: Session) =>
  s.exercises.reduce((sum, e) => sum + (porTempo(medidaDe(e)) ? feitas(e).reduce((n, x) => n + (x.seconds ?? 0), 0) : 0), 0);

export const sessionMeters = (s: Session) =>
  (s.distanciaM ?? 0) + s.exercises.reduce((sum, e) => sum + feitas(e).reduce((n, x) => n + (x.meters ?? 0), 0), 0);

/** Duração do treino ou da atividade, em minutos. */
export const sessionMinutes = (s: Session) => Math.max(0, Math.round(((s.finishedAt ?? s.startedAt) - s.startedAt) / 60_000));

/** Ritmo em min/km ("5:36"); `undefined` sem distância. */
export const pace = (minutes: number, meters: number) =>
  meters > 0 && minutes > 0 ? formatClock((minutes * 60_000) / (meters / 1000)) : undefined;

/** O número que melhor resume a sessão: kg na musculação, km na corrida, reps no peso do corpo, senão minutos. */
export const resumo = (s: Session): { valor: string; unidade: string } => {
  const kg = sessionVolume(s);
  if (kg > 0) return { valor: formatKg(kg), unidade: 'kg' };
  const m = sessionMeters(s);
  if (m > 0) return { valor: formatKm(m), unidade: 'km' };
  const reps = sessionReps(s);
  if (reps > 0) return { valor: String(reps), unidade: 'reps' };
  return { valor: String(sessionMinutes(s)), unidade: 'min' };
};

export const formatSet = (s: SetLog, medida: Medida = 'carga') =>
  medida === 'carga' ? `${formatKg(s.weight)}×${s.reps}`
    : medida === 'reps' ? `${s.reps}`
      : medida === 'cardio' ? `${Math.round((s.seconds ?? 0) / 60)} min${s.meters ? ` · ${formatKm(s.meters)} km` : ''}`
        : formatSeconds(s.seconds ?? 0);

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

export const summarizeSets = (sets: SetLog[], medida: Medida = 'carga') => sets.map((s) => formatSet(s, medida)).join(' · ');

/** Exercício da ficha → registro do treino, já preenchido com o que foi feito da última vez. */
export const logFromPlan = (ex: PlanExercise, history: Session[]): ExerciseLog => {
  const last = lastSets(history, exerciseKey(ex));
  const medida = medidaDe(ex);
  const sets = Array.from({ length: ex.sets }, (_, i): SetLog => {
    const prev = last?.[Math.min(i, last.length - 1)];
    const set: SetLog = { weight: prev?.weight ?? ex.weight, reps: prev?.reps ?? ex.reps, done: false };
    if (porTempo(medida)) set.seconds = prev?.seconds ?? ex.seconds ?? 30;
    if (medida === 'cardio') set.meters = prev?.meters ?? ex.meters ?? 0;
    return set;
  });
  return { name: ex.name, catalogKey: ex.catalogKey, unilateral: ex.unilateral, sets, ...(ex.medida && { medida: ex.medida }) };
};

/** Cria o treino a partir da ficha. */
export const startSession = (plan: Plan, history: Session[], now = Date.now()): Session => ({
  id: uid(),
  tipo: 'ficha',
  planId: plan.id,
  planName: plan.name,
  planTitle: plan.title,
  ...(plan.lugar && { lugar: plan.lugar }),
  startedAt: now,
  exercises: plan.exercises.map((ex) => logFromPlan(ex, history)),
});

/** Treino sem ficha: começa vazio e os exercícios entram na hora. */
export const startFree = (now = Date.now()): Session => ({
  id: uid(), tipo: 'livre', planId: '', planName: '+', planTitle: 'Treino livre', startedAt: now, exercises: [],
});

/** Registro avulso (corrida, futebol…): sem séries, só duração, distância e intensidade. */
export const newActivity = (a: { nome: string; inicio: number; minutos: number; metros?: number; intensidade?: Intensidade; nota?: string }): Session => ({
  id: uid(), tipo: 'atividade', planId: '', planName: '', planTitle: a.nome,
  startedAt: a.inicio, finishedAt: a.inicio + a.minutos * 60_000, exercises: [],
  ...(a.metros ? { distanciaM: a.metros } : {}),
  ...(a.intensidade && { intensidade: a.intensidade }),
  ...(a.nota?.trim() ? { nota: a.nota.trim() } : {}),
});

/** O histórico fica do mais novo para o mais antigo, mesmo quando se lança um treino de ontem. */
export const insertSession = (history: Session[], s: Session) => [...history, s].sort((a, b) => b.startedAt - a.startedAt);

const mapExercise = (s: Session, index: number, fn: (e: ExerciseLog) => ExerciseLog): Session => ({
  ...s,
  exercises: s.exercises.map((e, i) => (i === index ? fn(e) : e)),
});

export const updateSet = (s: Session, ex: number, set: number, patch: Partial<SetLog>) =>
  mapExercise(s, ex, (e) => ({ ...e, sets: e.sets.map((x, i) => (i === set ? { ...x, ...patch } : x)) }));

export const addSet = (s: Session, ex: number) =>
  mapExercise(s, ex, (e) => {
    const last = e.sets.at(-1);
    return { ...e, sets: [...e.sets, { ...last, weight: last?.weight ?? 0, reps: last?.reps ?? 0, done: false }] };
  });

/** Remove a última série, mantendo pelo menos uma. */
export const removeSet = (s: Session, ex: number) =>
  mapExercise(s, ex, (e) => (e.sets.length > 1 ? { ...e, sets: e.sets.slice(0, -1) } : e));

export const addExercise = (s: Session, e: ExerciseLog): Session => ({ ...s, exercises: [...s.exercises, e] });
export const removeExercise = (s: Session, index: number): Session => ({ ...s, exercises: s.exercises.filter((_, i) => i !== index) });

/**
 * Próxima ficha na sequência A → B → C → A, a partir do último treino de ficha da academia.
 * Fichas de casa, treinos livres e atividades não mexem na sequência.
 */
export const nextPlan = (plans: Plan[], history: Session[]): Plan | undefined => {
  const gym = plans.filter((p) => p.lugar !== 'casa');
  const last = history.find((s) => gym.some((p) => p.id === s.planId));
  const i = gym.findIndex((p) => p.id === last?.planId);
  return gym[(i + 1) % gym.length];
};

export const dayKey = (t: number | Date) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** "hoje", "ontem" ou "há N dias", contando dias do calendário. */
export const daysAgo = (t: number, now = Date.now()) => {
  const days = Math.round((new Date(now).setHours(0, 0, 0, 0) - new Date(t).setHours(0, 0, 0, 0)) / 86_400_000);
  return days <= 0 ? 'hoje' : days === 1 ? 'ontem' : `há ${days} dias`;
};

/** Variação (%) do volume em relação ao treino anterior da mesma ficha; `undefined` se não houver base. */
export const volumeChange = (history: Session[], session: Session): number | undefined => {
  const i = history.findIndex((s) => s.id === session.id);
  const previous = i < 0 || !session.planId ? undefined : history.slice(i + 1).find((s) => s.planId === session.planId);
  const before = previous ? sessionVolume(previous) : 0;
  return before > 0 ? Math.round((sessionVolume(session) / before - 1) * 100) : undefined;
};

/** A mesma variação para o histórico inteiro, numa passada só (do mais antigo ao mais novo). */
export const volumeChanges = (history: Session[]): Map<string, number> => {
  const out = new Map<string, number>();
  const anterior = new Map<string, number>();
  for (let i = history.length - 1; i >= 0; i--) {
    const s = history[i];
    if (!s.planId) continue;
    const v = sessionVolume(s);
    const before = anterior.get(s.planId) ?? 0;
    if (before > 0) out.set(s.id, Math.round((v / before - 1) * 100));
    anterior.set(s.planId, v);
  }
  return out;
};

/** Treinos, minutos e metros entre duas datas (resumo da semana). */
export const totals = (history: Session[], from: number, to: number) => {
  const list = history.filter((s) => s.startedAt >= from && s.startedAt < to);
  return {
    sessions: list.length,
    minutes: list.reduce((n, s) => n + sessionMinutes(s), 0),
    meters: list.reduce((n, s) => n + sessionMeters(s), 0),
  };
};

type Raw = Record<string, unknown>;
const isRaw = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const rawList = (v: unknown): Raw[] => (Array.isArray(v) ? v.filter(isRaw) : []);
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const count = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback);
const MEDIDAS: Medida[] = ['reps', 'tempo', 'cardio', 'alongamento'];
const medidaDoBackup = (v: unknown) => (MEDIDAS.includes(v as Medida) ? { medida: v as Medida } : {});
const lugarDoBackup = (v: unknown) => (v === 'casa' || v === 'academia' ? { lugar: v as Lugar } : {});
const positivo = <K extends string>(k: K, v: unknown) =>
  (typeof v === 'number' && Number.isFinite(v) && v > 0 ? { [k]: v } : {}) as { [P in K]?: number };

/** Um backup colado à mão pode estar incompleto: completa o que falta em vez de travar o app. */
const cleanPlan = (p: Raw): Plan => ({
  id: str(p.id) || uid(),
  name: str(p.name, '?'),
  title: str(p.title),
  ...lugarDoBackup(p.lugar),
  exercises: rawList(p.exercises).map((e) => ({
    id: str(e.id) || uid(),
    name: str(e.name, 'Exercício'),
    catalogKey: typeof e.catalogKey === 'string' ? e.catalogKey : undefined,
    sets: Math.round(count(e.sets, 3)),
    reps: Math.round(count(e.reps, 10)),
    weight: count(e.weight, 0),
    unilateral: e.unilateral === true,
    ...medidaDoBackup(e.medida), ...positivo('seconds', e.seconds), ...positivo('meters', e.meters),
  })),
});

const cleanSession = (s: Raw): Session => ({
  id: str(s.id) || uid(),
  ...(s.tipo === 'livre' || s.tipo === 'atividade' ? { tipo: s.tipo } : {}),
  planId: str(s.planId),
  planName: str(s.planName, s.tipo === 'atividade' ? '' : '?'),
  planTitle: str(s.planTitle),
  ...lugarDoBackup(s.lugar),
  startedAt: count(s.startedAt, 0),
  finishedAt: typeof s.finishedAt === 'number' ? s.finishedAt : undefined,
  ...positivo('distanciaM', s.distanciaM),
  ...(s.intensidade === 'leve' || s.intensidade === 'moderada' || s.intensidade === 'forte' ? { intensidade: s.intensidade } : {}),
  ...(typeof s.nota === 'string' && s.nota ? { nota: s.nota } : {}),
  exercises: rawList(s.exercises).map((e) => ({
    name: str(e.name, 'Exercício'),
    catalogKey: typeof e.catalogKey === 'string' ? e.catalogKey : undefined,
    unilateral: e.unilateral === true,
    ...medidaDoBackup(e.medida),
    sets: rawList(e.sets).map((x) => ({
      weight: count(x.weight, 0), reps: count(x.reps, 0), done: x.done === true,
      ...positivo('seconds', x.seconds), ...positivo('meters', x.meters),
    })),
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
