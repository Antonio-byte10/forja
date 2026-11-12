import type { Plan, PlanExercise } from '@/lib/types';
import { catalog } from './catalog';

/** [chave do catálogo, séries, repetições (ou segundos, nos exercícios por tempo), carga inicial] */
type Row = [key: string, sets: number, amount: number, weight?: number];

const exercises = (planId: string, rows: Row[]): PlanExercise[] =>
  rows.map(([key, sets, amount, weight = 0], i) => {
    const { name, unilateral, medida } = catalog[key];
    const porTempo = medida === 'tempo' || medida === 'alongamento' || medida === 'cardio';
    return {
      id: `${planId}-${i}`, name, catalogKey: key, unilateral, sets, weight,
      reps: porTempo ? 0 : amount,
      ...(porTempo && { seconds: amount }),
      ...(medida && { medida }),
    };
  });

/**
 * Ficha de casa, sem impacto (nenhum salto) e só com o peso do corpo: 6 tipos de flexão alternados com
 * 6 de abdômen. A ordem já vem em pares (uma flexão, um abdominal), com aquecimento e volta à calma.
 */
export const fichaCasa: Plan = {
  id: 'F', name: 'F', title: 'Flexão e abdômen', lugar: 'casa',
  exercises: exercises('F', [
    ['marcha_joelho_alto', 1, 60], ['flexao_parede', 1, 15], ['perdigueiro', 1, 16],
    ['flexao_inclinada', 3, 12], ['abdominal', 3, 15],
    ['flexao', 3, 10], ['abdominal_infra', 3, 12],
    ['flexao_aberta', 3, 10], ['dead_bug', 3, 16],
    ['flexao_diamante', 3, 8], ['canoa', 3, 25],
    ['flexao_pike', 3, 8], ['prancha_toque_ombro', 3, 20],
    ['flexao_negativa', 2, 5], ['prancha', 2, 40],
    ['postura_crianca', 1, 45], ['torcao_coluna', 1, 60],
  ]),
};

/** Fichas de exemplo. As da academia são curtas para treinar rápido: 5 exercícios e 16 séries cada. Editáveis no app. */
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
  fichaCasa,
];
