import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { defaultPlans, fichaCasa } from '@/data/defaults';
import type { Backup, Plan, PlanExercise, Session, SetLog } from '@/lib/types';
import * as w from '@/lib/workout';

const storage = createJSONStorage(() => AsyncStorage);

type Store = Backup & {
  savePlan: (plan: Plan) => void;
  deletePlan: (id: string) => void;
  addSession: (session: Session) => void;
  deleteSession: (id: string) => void;
  restore: (data: Backup) => void;
};

/** Treino em andamento que estava salvo junto com o histórico (versões antigas); vai para `useActive`. */
let legado: Session | undefined;

/** Dados antigos → formato atual. Versão 2: a ficha de casa entra uma vez só, sem mexer nas fichas do usuário. */
export function migrate(state: unknown, version: number): Backup {
  const old = (state ?? {}) as Partial<Backup> & { active?: Session };
  let plans = old.plans ?? defaultPlans;
  if (version < 2) {
    legado = old.active;
    if (!plans.some((p) => p.id === fichaCasa.id)) {
      const livre = plans.some((p) => p.name === fichaCasa.name)
        ? 'FGHIJKLMNOPQRSTUVWXYZ'.split('').find((l) => !plans.some((p) => p.name === l)) ?? '?'
        : fichaCasa.name;
      plans = [...plans, { ...fichaCasa, name: livre }];
    }
  }
  return { plans, history: old.history ?? [] };
}

/** Fichas e histórico. Só grava no aparelho quando um deles muda. */
export const useStore = create<Store>()(
  persist(
    (set) => ({
      plans: defaultPlans,
      history: [],
      savePlan: (plan) =>
        set(({ plans }) => ({
          plans: plans.some((p) => p.id === plan.id) ? plans.map((p) => (p.id === plan.id ? plan : p)) : [...plans, plan],
        })),
      deletePlan: (id) => set(({ plans }) => ({ plans: plans.filter((p) => p.id !== id) })),
      addSession: (session) => set(({ history }) => ({ history: w.insertSession(history, session) })),
      deleteSession: (id) => set(({ history }) => ({ history: history.filter((s) => s.id !== id) })),
      restore: ({ plans, history }) => {
        set({ plans, history });
        useActive.setState({ active: undefined });
      },
    }),
    {
      name: 'treino-v1',
      version: 2,
      storage,
      migrate,
      partialize: ({ plans, history }) => ({ plans, history }),
    },
  ),
);

type Active = {
  active?: Session;
  start: (planId: string) => void;
  startFree: () => void;
  updateSet: (ex: number, set: number, patch: Partial<SetLog>) => void;
  addSet: (ex: number) => void;
  removeSet: (ex: number) => void;
  addExercise: (exercise: PlanExercise) => void;
  removeExercise: (ex: number) => void;
  finish: () => void;
  discard: () => void;
};

/**
 * Treino em andamento, salvo separado: cada número digitado regrava só o treino atual,
 * e não o histórico inteiro.
 */
export const useActive = create<Active>()(
  persist(
    (set, get) => {
      const edit = (fn: (s: Session) => Session) => set(({ active }) => (active ? { active: fn(active) } : {}));
      return {
        start: (planId) => {
          const data = useStore.getState();
          const plan = data.plans.find((p) => p.id === planId);
          if (plan) set({ active: w.startSession(plan, data.history) });
        },
        startFree: () => set({ active: w.startFree() }),
        updateSet: (ex, i, patch) => edit((s) => w.updateSet(s, ex, i, patch)),
        addSet: (ex) => edit((s) => w.addSet(s, ex)),
        removeSet: (ex) => edit((s) => w.removeSet(s, ex)),
        addExercise: (exercise) => edit((s) => w.addExercise(s, w.logFromPlan(exercise, useStore.getState().history))),
        removeExercise: (ex) => edit((s) => w.removeExercise(s, ex)),
        finish: () => {
          const { active } = get();
          if (!active) return;
          useStore.getState().addSession({ ...active, finishedAt: Date.now() });
          set({ active: undefined });
        },
        discard: () => set({ active: undefined }),
      };
    },
    { name: 'treino-ativo', storage, partialize: ({ active }) => ({ active }) },
  ),
);

const hydrated = () => useStore.persist.hasHydrated() && useActive.persist.hasHydrated();
const onHydrated = (fn: () => void) => {
  const a = useStore.persist.onFinishHydration(fn);
  const b = useActive.persist.onFinishHydration(fn);
  return () => { a(); b(); };
};

// Depois que os dois carregam, o treino em andamento da versão antiga é reaproveitado.
const reaproveitar = () => {
  if (!hydrated() || !legado) return;
  if (!useActive.getState().active) useActive.setState({ active: legado });
  legado = undefined;
};
onHydrated(reaproveitar);
reaproveitar();

/** Espera os dados salvos carregarem antes de mostrar as telas. */
export const useHydrated = () => useSyncExternalStore(onHydrated, hydrated);
