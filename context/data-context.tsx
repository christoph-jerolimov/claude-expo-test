import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as storage from '@/utils/storage';
import { writeWeightToHealthKit } from '@/utils/healthkit';

interface DataContextType {
  data: storage.AppData | null;
  loading: boolean;
  addEntry: (weight: number) => Promise<void>;
  deleteEntry: (date: string) => Promise<void>;
  updateSettings: (settings: Partial<storage.AppSettings>) => Promise<void>;
  exportData: () => Promise<void>;
  importData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<storage.AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.loadData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const addEntry = useCallback(async (weight: number) => {
    setData((prev) => {
      if (!prev) return prev;
      const today = new Date().toISOString().split('T')[0];
      const entry: storage.WeightEntry = {
        date: today,
        weight,
        timestamp: new Date().toISOString(),
      };
      const filtered = prev.entries.filter((e) => e.date !== today);
      const entries = [...filtered, entry].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      const updated = { ...prev, entries };
      storage.saveData(updated);

      // Write to HealthKit if enabled
      if (prev.settings.healthKitEnabled) {
        writeWeightToHealthKit(weight, prev.settings.unit, new Date());
      }

      return updated;
    });
  }, []);

  const deleteEntry = useCallback(async (date: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const entries = prev.entries.filter((e) => e.date !== date);
      const updated = { ...prev, entries };
      storage.saveData(updated);
      return updated;
    });
  }, []);

  const updateSettings = useCallback(async (settings: Partial<storage.AppSettings>) => {
    setData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, settings: { ...prev.settings, ...settings } };
      storage.saveData(updated);
      return updated;
    });
  }, []);

  const exportData = useCallback(async () => {
    try {
      const uri = await storage.getExportUri();
      await Sharing.shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Weight Data',
      });
    } catch {
      Alert.alert('Export Failed', 'Could not export data.');
    }
  }, []);

  const importData = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      const imported = await storage.importFromUri(file.uri);
      setData(imported);
      Alert.alert('Import Successful', `Imported ${imported.entries.length} entries.`);
    } catch {
      Alert.alert('Import Failed', 'The file format is invalid.');
    }
  }, []);

  return (
    <DataContext.Provider
      value={{ data, loading, addEntry, deleteEntry, updateSettings, exportData, importData }}>
      {children}
    </DataContext.Provider>
  );
}
