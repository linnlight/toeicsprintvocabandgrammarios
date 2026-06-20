import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PersistedAppState } from '@/domain/models';

const STORAGE_KEY = 'vocab-sprint.progress.v1';

export interface ProgressStorage {
  load(): Promise<PersistedAppState | null>;
  save(state: PersistedAppState): Promise<void>;
  clear(): Promise<void>;
}

export const localProgressStorage: ProgressStorage = {
  async load() {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    try {
      return JSON.parse(value) as PersistedAppState;
    } catch {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }
  },
  async save(state) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
  async clear() {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
