import { File, Paths } from 'expo-file-system';

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

const dataFile = new File(Paths.document, 'weight-data.json');
const exportFile = new File(Paths.cache, 'weight-data-export.json');

const DEFAULT_DATA: AppData = {
  entries: [],
  settings: {
    unit: 'lbs',
    healthKitEnabled: false,
  },
};

export async function loadData(): Promise<AppData> {
  try {
    if (!dataFile.exists) return { ...DEFAULT_DATA, entries: [] };
    const json = await dataFile.text();
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
  dataFile.write(JSON.stringify(data, null, 2));
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
  exportFile.write(JSON.stringify(data, null, 2));
  return exportFile.uri;
}

export async function importFromUri(fileUri: string): Promise<AppData> {
  const importFile = new File(fileUri);
  const json = await importFile.text();
  const imported = JSON.parse(json) as AppData;
  if (!Array.isArray(imported.entries) || !imported.settings) {
    throw new Error('Invalid data format');
  }
  await saveData(imported);
  return imported;
}
