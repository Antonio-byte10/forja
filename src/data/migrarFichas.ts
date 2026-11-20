import { shallow } from 'zustand/vanilla/shallow';
import type { Plan } from '../lib/types';
import { defaultPlans, exercises } from './defaults';

// Compara com os modelos distribuídos na versão anterior antes de substituir uma ficha.
const anteriores = {
  A: exercises('A', [
    ['supino_reto', 4, 10, 40], ['supino_inclinado_halter', 3, 10, 18], ['crossover', 3, 12, 15],
    ['triceps_corda', 3, 12, 20], ['triceps_frances_corda', 3, 12, 15],
  ]),
  B: exercises('B', [
    ['puxada_frente', 4, 10, 45], ['remada_baixa', 3, 10, 40], ['serrote', 3, 10, 20],
    ['rosca_direta', 3, 10, 20], ['rosca_martelo', 3, 12, 10],
  ]),
};

export function migrarFichas(plans: Plan[]): Plan[] {
  const atualizadas = plans.map((plan) => {
    if (plan.id !== 'A' && plan.id !== 'B') return plan;
    const antiga = anteriores[plan.id];
    const nova = defaultPlans.find((p) => p.id === plan.id)!;
    if (plan.lugar === 'casa' || plan.name !== nova.name || plan.title !== nova.title ||
      plan.exercises.length !== antiga.length || !plan.exercises.every((e, i) => shallow(e, antiga[i]))) return plan;
    return { ...plan, exercises: nova.exercises };
  });
  if (plans.some((p) => p.id === 'D' || p.name === 'D')) return atualizadas;
  const casa = atualizadas.findIndex((p) => p.lugar === 'casa');
  atualizadas.splice(casa < 0 ? atualizadas.length : casa, 0, defaultPlans.find((p) => p.id === 'D')!);
  return atualizadas;
}
