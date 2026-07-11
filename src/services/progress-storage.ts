import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PersistedAppState } from '@/domain/models';
import { parsePersistedAppState } from '@/domain/persistence';

const STORAGE_KEY = 'vocab-sprint.progress.v1';
let pendingWrite = Promise.resolve();

function enqueueWrite(operation: () => Promise<void>): Promise<void> {
  const result = pendingWrite.then(operation, operation);
  pendingWrite = result.catch(() => undefined);
  return result;
}

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
      const state = parsePersistedAppState(JSON.parse(value));
      if (state) return state;
    } catch {
      // Invalid local data is removed below and replaced with safe defaults.
    }
    await enqueueWrite(() => AsyncStorage.removeItem(STORAGE_KEY));
    return null;
  },
  async save(state) {
    const value = JSON.stringify(state);
    await enqueueWrite(() => AsyncStorage.setItem(STORAGE_KEY, value));
  },
  async clear() {
    await enqueueWrite(() => AsyncStorage.removeItem(STORAGE_KEY));
  },
};
