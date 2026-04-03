import { Platform } from 'react-native';

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number;
  timestamp: string; // ISO timestamp
}

export interface AppSettings {
  unit: 'kg' | 'lbs';
  healthKitEnabled: boolean;
}

export interface AppData {
  entries: WeightEntry[];
  settings: AppSettings;
}

const STORAGE_KEY = 'weight-data';

const DEFAULT_DATA: AppData = {
  entries: [],
  settings: {
    unit: 'lbs',
    healthKitEnabled: false,
  },
};

// Lazy-load expo-file-system only on native to avoid web crash
function getNativeFile(name: string) {
  const { File, Paths } = require('expo-file-system') as typeof import('expo-file-system');
  return new File(Paths.document, name);
}

function getNativeCacheFile(name: string) {
  const { File, Paths } = require('expo-file-system') as typeof import('expo-file-system');
  return new File(Paths.cache, name);
}

export async function loadData(): Promise<AppData> {
  try {
    if (Platform.OS === 'web') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_DATA, entries: [] };
      const data = JSON.parse(raw) as AppData;
      if (!Array.isArray(data.entries) || !data.settings) {
        return { ...DEFAULT_DATA, entries: [] };
      }
      return data;
    }

    const file = getNativeFile('weight-data.json');
    if (!file.exists) return { ...DEFAULT_DATA, entries: [] };
    const json = await file.text();
    const data = JSON.parse(json) as AppData;
    if (!Array.isArray(data.entries) || !data.settings) {
      return { ...DEFAULT_DATA, entries: [] };
    }
    return data;
  } catch {
    return { ...DEFAULT_DATA, entries: [] };
  }
}

export async function saveData(data: AppData): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  if (Platform.OS === 'web') {
    localStorage.setItem(STORAGE_KEY, json);
    return;
  }
  getNativeFile('weight-data.json').write(json);
}

export async function addEntry(
  data: AppData,
  weight: number,
): Promise<AppData> {
  const today = new Date().toISOString().split('T')[0];
  const entry: WeightEntry = {
    date: today,
    weight,
    timestamp: new Date().toISOString(),
  };

  const filtered = data.entries.filter((e) => e.date !== today);
  const entries = [...filtered, entry].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const updated = { ...data, entries };
  await saveData(updated);
  return updated;
}

export async function deleteEntry(
  data: AppData,
  date: string,
): Promise<AppData> {
  const entries = data.entries.filter((e) => e.date !== date);
  const updated = { ...data, entries };
  await saveData(updated);
  return updated;
}

export async function updateSettings(
  data: AppData,
  settings: Partial<AppSettings>,
): Promise<AppData> {
  const updated = { ...data, settings: { ...data.settings, ...settings } };
  await saveData(updated);
  return updated;
}

export async function getExportUri(): Promise<string> {
  const data = await loadData();
  const json = JSON.stringify(data, null, 2);

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }

  const file = getNativeCacheFile('weight-data-export.json');
  file.write(json);
  return file.uri;
}

export async function importFromUri(fileUri: string): Promise<AppData> {
  let json: string;

  if (Platform.OS === 'web') {
    const response = await fetch(fileUri);
    json = await response.text();
  } else {
    const { File } = require('expo-file-system') as typeof import('expo-file-system');
    const importFile = new File(fileUri);
    json = await importFile.text();
  }

  const imported = JSON.parse(json) as AppData;
  if (!Array.isArray(imported.entries) || !imported.settings) {
    throw new Error('Invalid data format');
  }
  await saveData(imported);
  return imported;
}
