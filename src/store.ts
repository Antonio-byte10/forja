import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { defaultPlans } from '@/data/defaults';
import type { Backup, Plan, Session, SetLog } from '@/lib/types';
import * as w from '@/lib/workout';

type Store = Backup & {
  active?: Session;
  start: (planId: string) => void;
  updateSet: (ex: number, set: number, patch: Partial<SetLog>) => void;
  addSet: (ex: number) => void;
  removeSet: (ex: number) => void;
  finish: () => void;
  discard: () => void;
  savePlan: (plan: Plan) => void;
  deletePlan: (id: string) => void;
  deleteSession: (id: string) => void;
  restore: (data: Backup) => void;
};

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const editActive = (fn: (s: Session) => Session) =>
        set(({ active }) => (active ? { active: fn(active) } : {}));

      return {
        plans: defaultPlans,
        history: [],
        start: (planId) => {
          const plan = get().plans.find((p) => p.id === planId);
          if (plan) set({ active: w.startSession(plan, get().history) });
        },
        updateSet: (ex, i, patch) => editActive((s) => w.updateSet(s, ex, i, patch)),
        addSet: (ex) => editActive((s) => w.addSet(s, ex)),
        removeSet: (ex) => editActive((s) => w.removeSet(s, ex)),
        finish: () =>
          set(({ active, history }) =>
            active ? { active: undefined, history: [{ ...active, finishedAt: Date.now() }, ...history] } : {},
          ),
        discard: () => set({ active: undefined }),
        savePlan: (plan) =>
          set(({ plans }) => ({
            plans: plans.some((p) => p.id === plan.id) ? plans.map((p) => (p.id === plan.id ? plan : p)) : [...plans, plan],
          })),
        deletePlan: (id) => set(({ plans }) => ({ plans: plans.filter((p) => p.id !== id) })),
        deleteSession: (id) => set(({ history }) => ({ history: history.filter((s) => s.id !== id) })),
        restore: ({ plans, history }) => set({ plans, history, active: undefined }),
      };
    },
    { name: 'treino-v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

/** Espera os dados salvos carregarem antes de mostrar as telas. */
export const useHydrated = () =>
  useSyncExternalStore(useStore.persist.onFinishHydration, useStore.persist.hasHydrated);
