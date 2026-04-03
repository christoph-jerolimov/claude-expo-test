import { View, Pressable, Switch, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useData } from '@/context/data-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { isHealthKitAvailable, requestHealthKitPermissions } from '@/utils/healthkit';
import { Fonts } from '@/constants/theme';

export default function SettingsScreen() {
  const { data, updateSettings, exportData, importData } = useData();
  const tint = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const bg = useThemeColor({}, 'background');

  if (!data) return null;

  const { settings } = data;

  const handleUnitChange = (unit: 'kg' | 'lbs') => {
    updateSettings({ unit });
  };

  const handleHealthKitToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestHealthKitPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please grant Apple Health permissions in Settings to use this feature.',
        );
        return;
      }
    }
    updateSettings({ healthKitEnabled: enabled });
  };

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <ThemedText style={[styles.title, { fontFamily: Fonts?.rounded }]}>
            Settings
          </ThemedText>

          {/* Units */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: iconColor }]}>
              UNITS
            </ThemedText>
            <View style={[styles.card, { backgroundColor: bg }]}>
              <View style={styles.segmentedControl}>
                {(['kg', 'lbs'] as const).map((unit) => (
                  <Pressable
                    key={unit}
                    onPress={() => handleUnitChange(unit)}
                    style={[
                      styles.segment,
                      {
                        backgroundColor:
                          settings.unit === unit ? tint : 'transparent',
                      },
                    ]}>
                    <ThemedText
                      style={[
                        styles.segmentText,
                        {
                          color: settings.unit === unit ? bg : textColor,
                        },
                      ]}>
                      {unit}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Data */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: iconColor }]}>
              DATA
            </ThemedText>
            <View style={[styles.card, { backgroundColor: bg }]}>
              <Pressable
                onPress={exportData}
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.6 : 1 },
                ]}>
                <IconSymbol
                  name="square.and.arrow.up"
                  size={22}
                  color={tint}
                />
                <ThemedText style={styles.rowText}>Export Data</ThemedText>
              </Pressable>
              <View
                style={[styles.divider, { backgroundColor: iconColor + '20' }]}
              />
              <Pressable
                onPress={importData}
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.6 : 1 },
                ]}>
                <IconSymbol
                  name="square.and.arrow.down"
                  size={22}
                  color={tint}
                />
                <ThemedText style={styles.rowText}>Import Data</ThemedText>
              </Pressable>
            </View>
            <ThemedText style={[styles.caption, { color: iconColor }]}>
              Export your weight data as a JSON file. You can import it back on
              any device.
            </ThemedText>
          </View>

          {/* Apple Health */}
          {isHealthKitAvailable() && (
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: iconColor }]}>
                APPLE HEALTH
              </ThemedText>
              <View style={[styles.card, { backgroundColor: bg }]}>
                <View style={styles.row}>
                  <ThemedText style={styles.rowText}>
                    Sync to Apple Health
                  </ThemedText>
                  <Switch
                    value={settings.healthKitEnabled}
                    onValueChange={handleHealthKitToggle}
                    trackColor={{ false: iconColor + '30', true: tint }}
                  />
                </View>
              </View>
              <ThemedText style={[styles.caption, { color: iconColor }]}>
                When enabled, weight entries will also be saved to Apple Health.
              </ThemedText>
            </View>
          )}

          {/* About */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: iconColor }]}>
              ABOUT
            </ThemedText>
            <View style={[styles.card, { backgroundColor: bg }]}>
              <View style={styles.row}>
                <ThemedText style={styles.rowText}>Version</ThemedText>
                <ThemedText style={{ color: iconColor }}>1.0.0</ThemedText>
              </View>
            </View>
          </View>

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
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    paddingTop: 8,
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  rowText: {
    fontSize: 16,
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 34,
  },
  caption: {
    fontSize: 13,
    marginLeft: 4,
    lineHeight: 18,
  },
});
