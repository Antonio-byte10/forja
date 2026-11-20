import type { Nutricao } from './nutricao';

/**
 * Como o exercício é medido:
 * carga = kg × reps · reps = só repetições (peso do corpo) · tempo = segundos ·
 * cardio = duração + distância · alongamento = segundos, sem descanso depois.
 * Sem o campo, vale 'carga' (é assim que os dados antigos estão salvos).
 */
export type Medida = 'carga' | 'reps' | 'tempo' | 'cardio' | 'alongamento';
export type Lugar = 'academia' | 'casa';

/** Exercício como está na ficha (o modelo). */
export type PlanExercise = {
  id: string;
  name: string;
  catalogKey?: string;
  medida?: Medida;
  sets: number;
  reps: number;
  /** Topo da faixa de repetições (ex.: 8–12 → reps 8, repsMax 12). Ao bater o topo em todas as séries, a carga sobe. */
  repsMax?: number;
  /** Carga inicial em kg — por lado quando unilateral. */
  weight: number;
  /** Duração planejada de cada série (tempo, cardio e alongamento). */
  seconds?: number;
  /** Distância planejada (cardio). */
  meters?: number;
  /** Descanso sugerido entre séries, em segundos (padrão: 90). */
  restSeconds?: number;
  /** Anotação fixa do exercício (ex.: regulagem do banco). */
  note?: string;
  unilateral: boolean;
};

export type Plan = { id: string; name: string; title: string; lugar?: Lugar; fimDeSemana?: boolean; exercises: PlanExercise[] };

export type SetLog = { weight: number; reps: number; done: boolean; seconds?: number; meters?: number };

export type ExerciseLog = {
  name: string;
  catalogKey?: string;
  medida?: Medida;
  restSeconds?: number;
  note?: string;
  /** Quantos kg o app somou à carga da última vez (sugestão de progressão), só para mostrar o aviso. */
  progressao?: number;
  unilateral: boolean;
  sets: SetLog[];
};

export type Intensidade = 'leve' | 'moderada' | 'forte';

export type Session = {
  id: string;
  /** ficha = treino de uma ficha · livre = montado na hora · atividade = registro avulso (corrida, futebol…). */
  tipo?: 'ficha' | 'livre' | 'atividade';
  planId: string;
  planName: string;
  planTitle: string;
  lugar?: Lugar;
  startedAt: number;
  finishedAt?: number;
  exercises: ExerciseLog[];
  /** Só nas atividades avulsas. */
  distanciaM?: number;
  intensidade?: Intensidade;
  nota?: string;
};

/** Peso corporal num dia. */
export type Peso = { t: number; kg: number };

/** Foto de progresso. O arquivo fica na pasta do app; `sessionId` liga a foto ao treino do dia. */
export type Foto = { id: string; t: number; uri: string; sessionId?: string };

export type Backup = { plans: Plan[]; history: Session[]; pesos?: Peso[]; nutricao?: Nutricao };

/** Preferências que não fazem parte do backup. */
export type Ajustes = { metaSemanal: number; ultimoBackup?: number; metaPassos: number; passos?: boolean; conectarSono?: boolean };
