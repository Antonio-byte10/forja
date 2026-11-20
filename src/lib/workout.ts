import { lerNutricao } from './nutricao';
import type { Backup, ExerciseLog, Intensidade, Lugar, Medida, Peso, Plan, PlanExercise, Session, SetLog } from './types';

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

/** Maior carga já concluída para o exercício no histórico (0 se nunca feito). */
export const bestWeight = (history: Session[], key: string): number =>
  history
    .flatMap((s) => s.exercises)
    .filter((e) => exerciseKey(e) === key && medidaDe(e) === 'carga')
    .flatMap((e) => e.sets)
    .filter((s) => s.done)
    .reduce((max, s) => Math.max(max, s.weight), 0);

const ANILHAS = [25, 20, 15, 10, 5, 2.5, 1.25];

/** Anilhas padrão de cada lado da barra (descontando a barra de 20 kg). */
export function platesPerSide(totalKg: number, barKg = 20): number[] {
  if (!Number.isFinite(totalKg) || totalKg <= barKg) return [];
  let resto = (totalKg - barKg) / 2;
  const out: number[] = [];
  for (const peso of ANILHAS) {
    while (resto + 1e-6 >= peso) {
      out.push(peso);
      resto -= peso;
    }
  }
  return out;
}

const BARRA_KEYS = new Set([
  'supino_reto', 'supino_inclinado', 'supino_declinado', 'supino_pegada_aberta', 'supino_fechado',
  'remada_curvada', 'levantamento_terra', 'remada_supinada', 'encolhimento', 'good_morning', 'rack_pull',
  'remada_alta', 'desenvolvimento_barra', 'desenvolvimento_militar',
  'rosca_direta', 'rosca_inversa', 'rosca_spider',
  'triceps_testa', 'triceps_frances',
  'rosca_punho', 'rosca_punho_inversa',
  'agachamento', 'stiff', 'agachamento_frontal', 'afundo_barra', 'terra_romeno', 'terra_sumo',
  'elevacao_pelvica', 'ponte_gluteo',
]);
const BARRA_INCLUI = /\b(barra|supino|agachamento|terra|stiff)\b/i;
const BARRA_EXCLUI = /\b(halter|halteres|maquina|máquina|cabo|polia|corda|smith|fixa)\b/i;

/** O que sobra de cada lado quando a carga não fecha com as anilhas padrão (ex.: 57 kg → falta 1 kg/lado). */
export function restoPorLado(totalKg: number, barKg = 20): number {
  if (!Number.isFinite(totalKg) || totalKg <= barKg) return 0;
  const usado = platesPerSide(totalKg, barKg).reduce((n, p) => n + p, 0);
  const resto = (totalKg - barKg) / 2 - usado;
  return resto > 1e-6 ? Math.round(resto * 100) / 100 : 0;
}

/** Indica se o exercício usa barra livre (onde faz sentido calcular anilhas por lado). */
export function usaBarra(e: { catalogKey?: string; name: string; unilateral?: boolean; medida?: Medida }): boolean {
  if (medidaDe(e) !== 'carga' || e.unilateral) return false;
  if (e.catalogKey) return BARRA_KEYS.has(e.catalogKey);
  return BARRA_INCLUI.test(e.name) && !BARRA_EXCLUI.test(e.name);
}

export const summarizeSets = (sets: SetLog[], medida: Medida = 'carga') => sets.map((s) => formatSet(s, medida)).join(' · ');

/** Quanto a carga sobe numa progressão: 1 kg por lado nos unilaterais (halteres), 2,5 kg nos demais. */
export const incremento = (unilateral: boolean) => (unilateral ? 1 : 2.5);

/**
 * Progressão dupla: se da última vez todas as séries chegaram ao topo da faixa de repetições
 * (ou às reps da ficha, sem faixa), sugere subir a carga. Devolve quantos kg somar (0 = manter).
 */
export const sugestaoDeCarga = (ex: PlanExercise, last?: SetLog[]): number => {
  if (medidaDe(ex) !== 'carga' || !last?.length || last.length < ex.sets) return 0;
  const alvo = Math.max(ex.repsMax ?? 0, ex.reps);
  const pesado = Math.max(...last.map((s) => s.weight));
  if (alvo <= 0 || pesado <= 0) return 0;
  return last.every((s) => s.reps >= alvo) ? incremento(ex.unilateral) : 0;
};

/** Anotação mais recente do exercício no histórico (a do último treino em que ele apareceu). */
const ultimaNota = (history: Session[], key: string) =>
  history.flatMap((s) => s.exercises).find((e) => exerciseKey(e) === key)?.note?.trim() || undefined;

/**
 * Exercício da ficha → registro do treino, já preenchido com o que foi feito da última vez.
 * `daFicha`: a anotação vem da ficha (que é atualizada ao finalizar); fora da ficha, do último treino.
 */
export const logFromPlan = (ex: PlanExercise, history: Session[], daFicha = false): ExerciseLog => {
  const key = exerciseKey(ex);
  const last = lastSets(history, key);
  const note = daFicha ? ex.note?.trim() || undefined : ex.note?.trim() || ultimaNota(history, key);
  const medida = medidaDe(ex);
  const subir = sugestaoDeCarga(ex, last);
  const base = subir ? Math.max(...(last ?? []).map((s) => s.weight)) : 0;
  const sets = Array.from({ length: ex.sets }, (_, i): SetLog => {
    const prev = last?.[Math.min(i, last.length - 1)];
    const set: SetLog = subir
      ? { weight: base + subir, reps: ex.reps, done: false }
      : { weight: prev?.weight ?? ex.weight, reps: prev?.reps ?? ex.reps, done: false };
    if (porTempo(medida)) set.seconds = prev?.seconds ?? ex.seconds ?? 30;
    if (medida === 'cardio') set.meters = prev?.meters ?? ex.meters ?? 0;
    return set;
  });
  return {
    name: ex.name, catalogKey: ex.catalogKey, unilateral: ex.unilateral, sets,
    ...(ex.medida && { medida: ex.medida }),
    ...(ex.restSeconds && { restSeconds: ex.restSeconds }),
    ...(note && { note }),
    ...(subir && { progressao: subir }),
  };
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
  exercises: plan.exercises.map((ex) => logFromPlan(ex, history, true)),
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

export const updateNote = (s: Session, ex: number, note: string) =>
  mapExercise(s, ex, (e) => ({ ...e, note }));

export const addSet = (s: Session, ex: number) =>
  mapExercise(s, ex, (e) => {
    const last = e.sets.at(-1);
    return { ...e, sets: [...e.sets, { ...last, weight: last?.weight ?? 0, reps: last?.reps ?? 0, done: false }] };
  });

/** Remove a última série, mantendo pelo menos uma. */
export const removeSet = (s: Session, ex: number) =>
  mapExercise(s, ex, (e) => (e.sets.length > 1 ? { ...e, sets: e.sets.slice(0, -1) } : e));

export const addExercise = (s: Session, e: ExerciseLog): Session => ({ ...s, exercises: [...s.exercises, e] });

/** Muda o exercício de posição (fazer fora da ordem da ficha). */
export const moveExercise = (s: Session, from: number, to: number): Session => {
  if (to < 0 || to >= s.exercises.length || from === to) return s;
  const list = [...s.exercises];
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
  return { ...s, exercises: list };
};

/** Troca um exercício por outro (aparelho ocupado), mantendo a posição. */
export const replaceExercise = (s: Session, index: number, e: ExerciseLog): Session =>
  mapExercise(s, index, () => e);

/** Antes de salvar: anotação vazia some (evita texto vazio no histórico) e o resto é aparado. */
export const limparNotas = (s: Session): Session => ({
  ...s,
  exercises: s.exercises.map(({ note, ...e }) => (note?.trim() ? { ...e, note: note.trim() } : e)),
});

/** O que foi anotado no treino passa para a ficha, para aparecer igual na próxima vez. */
export const notasParaFicha = (plan: Plan, s: Session): Plan => {
  const notas = new Map(s.exercises.map((e) => [exerciseKey(e), e.note?.trim() || undefined]));
  let mudou = false;
  const exercises = plan.exercises.map((e) => {
    const key = exerciseKey(e);
    if (!notas.has(key)) return e;
    const note = notas.get(key);
    if ((e.note?.trim() || undefined) === note) return e;
    mudou = true;
    const { note: _antiga, ...rest } = e;
    return note ? { ...rest, note } : rest;
  });
  return mudou ? { ...plan, exercises } : plan;
};
export const removeExercise = (s: Session, index: number): Session => ({ ...s, exercises: s.exercises.filter((_, i) => i !== index) });

/**
 * Próxima ficha na sequência A → B → C → A, a partir do último treino de ficha da academia.
 * No sábado e domingo, prioriza a ficha de fim de semana até ela ser feita uma vez.
 */
export const nextPlan = (plans: Plan[], history: Session[], hoje = new Date()): Plan | undefined => {
  const gym = plans.filter((p) => p.lugar !== 'casa');
  const dia = hoje.getDay();
  if (dia === 6 || dia === 0) {
    const sabado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (dia === 0 ? 1 : 0)).getTime();
    const pendente = gym.find((p) => p.fimDeSemana &&
      !history.some((s) => s.planId === p.id && s.startedAt >= sabado && s.startedAt <= hoje.getTime()));
    if (pendente) return pendente;
  }
  const regulares = gym.filter((p) => !p.fimDeSemana);
  if (!regulares.length) return undefined;
  const last = history.find((s) => regulares.some((p) => p.id === s.planId));
  const i = regulares.findIndex((p) => p.id === last?.planId);
  return regulares[(i + 1) % regulares.length];
};

/** 1RM estimado (fórmula de Epley). Com 1 repetição, é a própria carga. */
export const e1rm = (weight: number, reps: number) => (reps <= 1 ? weight : weight * (1 + reps / 30));

/** Recordes de carga batidos numa sessão, comparando com o que veio antes dela. */
export const recordesDaSessao = (history: Session[], session: Session) => {
  const antes = history.filter((h) => h.id !== session.id && h.startedAt < session.startedAt);
  return session.exercises.flatMap((e) => {
    if (medidaDe(e) !== 'carga') return [];
    const feitas = e.sets.filter((x) => x.done);
    if (!feitas.length) return [];
    const agora = Math.max(...feitas.map((x) => x.weight));
    const anterior = bestWeight(antes, exerciseKey(e));
    return anterior > 0 && agora > anterior ? [{ name: e.name, antes: anterior, agora }] : [];
  });
};

export type Ponto = { t: number; carga: number; e1rm: number; volume: number };

/** Evolução de um exercício de carga, do treino mais antigo ao mais novo. */
export const evolucao = (history: Session[], key: string): Ponto[] =>
  history
    .flatMap((s) => s.exercises.filter((e) => exerciseKey(e) === key && medidaDe(e) === 'carga').map((e) => ({ s, e })))
    .flatMap(({ s, e }) => {
      const feitas = e.sets.filter((x) => x.done && x.weight > 0);
      if (!feitas.length) return [];
      return [{
        t: s.startedAt,
        carga: Math.max(...feitas.map((x) => x.weight)),
        e1rm: Math.round(Math.max(...feitas.map((x) => e1rm(x.weight, x.reps))) * 10) / 10,
        volume: exerciseVolume(e),
      }];
    })
    .reverse();

export type ExercicioFeito = {
  key: string; name: string; catalogKey?: string; medida: Medida; vezes: number; ultimo: number; recorde: number;
};

/** Exercícios já feitos, do mais recente ao mais antigo, com quantas vezes e o recorde de carga. */
export const exerciciosFeitos = (history: Session[]): ExercicioFeito[] => {
  const out = new Map<string, ExercicioFeito>();
  for (const s of history) {
    for (const e of s.exercises) {
      const feitas = e.sets.filter((x) => x.done);
      if (!feitas.length) continue;
      const key = exerciseKey(e);
      const item = out.get(key) ?? { key, name: e.name, catalogKey: e.catalogKey, medida: medidaDe(e), vezes: 0, ultimo: s.startedAt, recorde: 0 };
      item.vezes++;
      if (medidaDe(e) === 'carga') item.recorde = Math.max(item.recorde, ...feitas.map((x) => x.weight));
      out.set(key, item);
    }
  }
  return [...out.values()];
};

/** Séries feitas por grupo muscular entre duas datas. `grupo` diz o grupo de cada exercício. */
export const seriesPorGrupo = (history: Session[], from: number, to: number, grupo: (e: ExerciseLog) => string | undefined) => {
  const out = new Map<string, number>();
  for (const s of history) {
    if (s.startedAt < from || s.startedAt >= to) continue;
    for (const e of s.exercises) {
      const g = grupo(e);
      const n = e.sets.filter((x) => x.done).length;
      if (g && n) out.set(g, (out.get(g) ?? 0) + n);
    }
  }
  return [...out.entries()].sort((a, b) => b[1] - a[1]);
};

const dois = (n: number) => String(n).padStart(2, '0');

/** Uma linha por série feita, para abrir no Excel ou no Planilhas (separador ";", vírgula decimal). */
export const historicoCsv = (history: Session[]) => {
  const cel = (v: string | number) => {
    const t = typeof v === 'number' ? String(v).replace('.', ',') : v;
    return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const linhas = [['data', 'hora', 'treino', 'exercicio', 'serie', 'kg', 'reps', 'segundos', 'metros', 'anotacao'].join(';')];
  for (const s of [...history].reverse()) {
    const d = new Date(s.startedAt);
    const data = `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
    const hora = `${dois(d.getHours())}:${dois(d.getMinutes())}`;
    const treino = s.tipo === 'atividade' || s.tipo === 'livre' ? s.planTitle : `Ficha ${s.planName}`;
    if (s.tipo === 'atividade') {
      linhas.push([data, hora, treino, s.planTitle, 1, '', '', sessionMinutes(s) * 60, s.distanciaM ?? '', s.nota ?? ''].map(cel).join(';'));
      continue;
    }
    for (const e of s.exercises) {
      e.sets.filter((x) => x.done).forEach((x, i) => {
        linhas.push([data, hora, treino, e.name, i + 1, x.weight, x.reps, x.seconds ?? '', x.meters ?? '', i === 0 ? e.note ?? '' : ''].map(cel).join(';'));
      });
    }
  }
  return linhas.join('\n');
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

/** Domingo 00:00 da semana de `t`. */
export const inicioDaSemana = (t: number) => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()).getTime();
};

/**
 * Semanas seguidas batendo a meta de treinos. A semana atual só conta se a meta já foi batida;
 * se ainda não, a sequência das semanas anteriores continua valendo.
 */
export const semanasSeguidas = (history: Session[], meta: number, now = Date.now()) => {
  if (meta <= 0 || !history.length) return 0;
  const porSemana = new Map<number, number>();
  for (const s of history) {
    const k = inicioDaSemana(s.startedAt);
    porSemana.set(k, (porSemana.get(k) ?? 0) + 1);
  }
  const semana = (n: number) => {
    const d = new Date(inicioDaSemana(now));
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7 * n).getTime();
  };
  let n = (porSemana.get(semana(0)) ?? 0) >= meta ? 0 : 1;
  let total = 0;
  while ((porSemana.get(semana(n)) ?? 0) >= meta) {
    total++;
    n++;
  }
  return total;
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
  ...(p.fimDeSemana === true && { fimDeSemana: true }),
  exercises: rawList(p.exercises).map((e) => ({
    id: str(e.id) || uid(),
    name: str(e.name, 'Exercício'),
    catalogKey: typeof e.catalogKey === 'string' ? e.catalogKey : undefined,
    sets: Math.round(count(e.sets, 3)),
    reps: Math.round(count(e.reps, 10)),
    ...positivo('repsMax', typeof e.repsMax === 'number' ? Math.round(e.repsMax) : undefined),
    weight: count(e.weight, 0),
    unilateral: e.unilateral === true,
    ...medidaDoBackup(e.medida), ...positivo('seconds', e.seconds), ...positivo('meters', e.meters),
    ...positivo('restSeconds', e.restSeconds),
    ...(typeof e.note === 'string' && e.note.trim() ? { note: e.note.trim() } : {}),
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
    ...positivo('restSeconds', e.restSeconds),
    ...(typeof e.note === 'string' && e.note.trim() ? { note: e.note.trim() } : {}),
    sets: rawList(e.sets).map((x) => ({
      weight: count(x.weight, 0), reps: count(x.reps, 0), done: x.done === true,
      ...positivo('seconds', x.seconds), ...positivo('meters', x.meters),
    })),
  })),
});

const cleanPesos = (v: unknown): Peso[] =>
  rawList(v)
    .filter((p) => typeof p.t === 'number' && typeof p.kg === 'number' && p.kg > 0 && p.kg < 500)
    .map((p) => ({ t: p.t as number, kg: p.kg as number }))
    .sort((a, b) => a.t - b.t);

export const parseBackup = (input: string): Backup => {
  const data: unknown = JSON.parse(input);
  if (!isRaw(data) || !Array.isArray(data.plans) || !Array.isArray(data.history)) throw new Error('Backup inválido');
  return {
    ...(data.nutricao !== undefined && { nutricao: lerNutricao(data.nutricao) }),
    ...(Array.isArray(data.pesos) && { pesos: cleanPesos(data.pesos) }),
    plans: rawList(data.plans).map(cleanPlan),
    // Mais novo primeiro, como o app espera.
    history: rawList(data.history).map(cleanSession).sort((a, b) => b.startedAt - a.startedAt),
  };
};
