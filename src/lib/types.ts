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
  /** Carga inicial em kg — por lado quando unilateral. */
  weight: number;
  /** Duração planejada de cada série (tempo, cardio e alongamento). */
  seconds?: number;
  /** Distância planejada (cardio). */
  meters?: number;
  unilateral: boolean;
};

export type Plan = { id: string; name: string; title: string; lugar?: Lugar; exercises: PlanExercise[] };

export type SetLog = { weight: number; reps: number; done: boolean; seconds?: number; meters?: number };

export type ExerciseLog = {
  name: string;
  catalogKey?: string;
  medida?: Medida;
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

export type Backup = { plans: Plan[]; history: Session[] };
