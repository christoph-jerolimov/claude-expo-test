import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WeightInput } from '@/components/weight-input';
import { WeightChart } from '@/components/weight-chart';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useData } from '@/context/data-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getTodayString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function TrackScreen() {
  const { data, loading, addEntry, deleteEntry } = useData();
  const iconColor = useThemeColor({}, 'icon');
  const tint = useThemeColor({}, 'tint');

  if (loading || !data) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tint} />
      </ThemedView>
    );
  }

  const { entries, settings } = data;
  const lastWeight =
    entries.length > 0
      ? entries[entries.length - 1].weight
      : settings.unit === 'kg'
        ? 70
        : 150;

  const recentEntries = [...entries].reverse().slice(0, 7);

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <ThemedText style={[styles.title, { fontFamily: Fonts?.rounded }]}>
              Track
            </ThemedText>
            <ThemedText style={[styles.date, { color: iconColor }]}>
              {getTodayString()}
            </ThemedText>
          </View>

          <WeightInput
            initialValue={lastWeight}
            unit={settings.unit}
            onSave={addEntry}
          />

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>History</ThemedText>
            <WeightChart entries={entries} unit={settings.unit} />
          </View>

          {recentEntries.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Recent</ThemedText>
              <View style={styles.entriesList}>
                {recentEntries.map((entry) => (
                  <View
                    key={entry.date}
                    style={[styles.entryRow, { borderBottomColor: iconColor + '20' }]}>
                    <ThemedText style={styles.entryDate}>
                      {formatDate(entry.date)}
                    </ThemedText>
                    <View style={styles.entryRight}>
                      <ThemedText style={styles.entryWeight}>
                        {entry.weight.toFixed(1)} {settings.unit}
                      </ThemedText>
                      <Pressable
                        onPress={() => deleteEntry(entry.date)}
                        hitSlop={12}>
                        <IconSymbol
                          name="trash"
                          size={18}
                          color={iconColor + '60'}
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 8,
    gap: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
  },
  date: {
    fontSize: 15,
  },
  section: {
    marginTop: 28,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  entriesList: {
    gap: 0,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryDate: {
    fontSize: 15,
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  entryWeight: {
    fontSize: 15,
    fontWeight: '600',
  },
});
