import { create } from 'zustand';
import type { ProjectFunction } from '../types';

const STORAGE_KEY = 'landing-constructor-functions';

interface FunctionsStore {
  functions: ProjectFunction[];
  selectedFunctionId: string | null;
  
  addFunction: () => void;
  updateFunction: (id: string, updates: Partial<ProjectFunction>) => void;
  deleteFunction: (id: string) => void;
  duplicateFunction: (id: string) => void;
  selectFunction: (id: string | null) => void;
  setFunctions: (functions: ProjectFunction[]) => void;
  clearFunctions: () => void;
  
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

const createDefaultFunction = (): ProjectFunction => {
  const now = Date.now();
  return {
    id: `function-${now}-${Math.random().toString(36).substr(2, 9)}`,
    name: `Функция_${Math.floor(Math.random() * 1000)}`,
    description: '',
    trigger: 'onClick',
    blockId: null,
    conditions: [],
    actions: [
      {
        id: `action-${now}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'log',
        name: 'Логирование',
        args: { message: 'Функция выполнена' },
      },
    ],
    type: 'visual',
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };
};

export const useFunctionsStore = create<FunctionsStore>((set, get) => ({
  functions: [],
  selectedFunctionId: null,

  addFunction: () => {
    const newFunction = createDefaultFunction();
    set((state) => ({
      functions: [...state.functions, newFunction],
      selectedFunctionId: newFunction.id,
    }));
    get().saveToLocalStorage();
  },

  updateFunction: (id, updates) => {
    set((state) => ({
      functions: state.functions.map((fn) =>
        fn.id === id
          ? { ...fn, ...updates, updatedAt: Date.now() }
          : fn
      ),
    }));
    get().saveToLocalStorage();
  },

  deleteFunction: (id) => {
    set((state) => ({
      functions: state.functions.filter((fn) => fn.id !== id),
      selectedFunctionId: state.selectedFunctionId === id ? null : state.selectedFunctionId,
    }));
    get().saveToLocalStorage();
  },

  duplicateFunction: (id) => {
    const functionToDuplicate = get().functions.find((fn) => fn.id === id);
    if (!functionToDuplicate) return;

    const now = Date.now();
    const duplicated: ProjectFunction = {
      ...functionToDuplicate,
      id: `function-${now}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${functionToDuplicate.name}_копия`,
      createdAt: now,
      updatedAt: now,
      actions: functionToDuplicate.actions.map((action) => ({
        ...action,
        id: `action-${now}-${Math.random().toString(36).substr(2, 9)}`,
      })),
      conditions: functionToDuplicate.conditions.map((condition) => ({
        ...condition,
        id: `condition-${now}-${Math.random().toString(36).substr(2, 9)}`,
      })),
    };

    set((state) => ({
      functions: [...state.functions, duplicated],
      selectedFunctionId: duplicated.id,
    }));
    get().saveToLocalStorage();
  },

  selectFunction: (id) => set({ selectedFunctionId: id }),

  setFunctions: (functions) => {
    set({ functions, selectedFunctionId: null });
    get().saveToLocalStorage();
  },

  clearFunctions: () => {
    set({
      functions: [],
      selectedFunctionId: null,
    });
    get().saveToLocalStorage();
  },

  saveToLocalStorage: () => {
    try {
      const { functions } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(functions));
    } catch (error) {
      console.error('Ошибка сохранения функций в LocalStorage:', error);
    }
  },

  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const functions = JSON.parse(stored) as ProjectFunction[];
        set({ functions });
      }
    } catch (error) {
      console.error('Ошибка загрузки функций из LocalStorage:', error);
      set({ functions: [] });
    }
  },
}));



