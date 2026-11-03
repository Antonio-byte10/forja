import type { Plan, PlanExercise } from '@/lib/types';
import { catalog } from './catalog';

/** [chave do catálogo, séries, repetições, carga inicial] */
type Row = [key: string, sets: number, reps: number, weight: number];

const exercises = (planId: string, rows: Row[]): PlanExercise[] =>
  rows.map(([key, sets, reps, weight], i) => ({
    id: `${planId}-${i}`,
    name: catalog[key].name,
    catalogKey: key,
    unilateral: catalog[key].unilateral,
    sets,
    reps,
    weight,
  }));

/** Fichas de exemplo, curtas para treinar rápido: 5 exercícios e 16 séries cada. Editáveis no app. */
export const defaultPlans: Plan[] = [
  {
    id: 'A', name: 'A', title: 'Peito e tríceps',
    exercises: exercises('A', [
      ['supino_reto', 4, 10, 40], ['supino_inclinado_halter', 3, 10, 18], ['crossover', 3, 12, 15],
      ['triceps_corda', 3, 12, 20], ['triceps_frances_corda', 3, 12, 15],
    ]),
  },
  {
    id: 'B', name: 'B', title: 'Costas e bíceps',
    exercises: exercises('B', [
      ['puxada_frente', 4, 10, 45], ['remada_baixa', 3, 10, 40], ['serrote', 3, 10, 20],
      ['rosca_direta', 3, 10, 20], ['rosca_martelo', 3, 12, 10],
    ]),
  },
  {
    id: 'C', name: 'C', title: 'Pernas e ombros',
    exercises: exercises('C', [
      ['leg_press', 4, 12, 120], ['cadeira_extensora', 3, 12, 35], ['mesa_flexora', 3, 12, 30],
      ['desenvolvimento', 3, 10, 14], ['elevacao_lateral', 3, 12, 8],
    ]),
  },
];
