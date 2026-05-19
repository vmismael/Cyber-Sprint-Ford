import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const webStorage: Storage = {
  async getItem(key) {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  async setItem(key, value) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

const nativeStorage: Storage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const secureStorage: Storage =
  Platform.OS === 'web' ? webStorage : nativeStorage;
