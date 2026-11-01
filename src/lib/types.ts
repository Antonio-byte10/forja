/** Exercício como está na ficha (o modelo). */
export type PlanExercise = {
  id: string;
  name: string;
  catalogKey?: string;
  sets: number;
  reps: number;
  /** Carga inicial em kg — por lado quando unilateral. */
  weight: number;
  unilateral: boolean;
};

export type Plan = { id: string; name: string; title: string; exercises: PlanExercise[] };

export type SetLog = { weight: number; reps: number; done: boolean };

export type ExerciseLog = {
  name: string;
  catalogKey?: string;
  unilateral: boolean;
  sets: SetLog[];
};

export type Session = {
  id: string;
  planId: string;
  planName: string;
  planTitle: string;
  startedAt: number;
  finishedAt?: number;
  exercises: ExerciseLog[];
};

export type Backup = { plans: Plan[]; history: Session[] };
