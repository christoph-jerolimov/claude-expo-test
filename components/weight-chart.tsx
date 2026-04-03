import { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { WeightEntry } from '@/utils/storage';

type Period = '1W' | '1M' | '1Y';

interface WeightChartProps {
  entries: WeightEntry[];
  unit: 'kg' | 'lbs';
}

const PERIODS: Period[] = ['1W', '1M', '1Y'];

function getStartDate(period: Period): Date {
  const now = new Date();
  switch (period) {
    case '1W':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    case '1M':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case '1Y':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  }
}

function formatLabel(dateStr: string, period: Period): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  if (period === '1Y') return month;
  return `${month} ${day}`;
}

export function WeightChart({ entries, unit }: WeightChartProps) {
  const [period, setPeriod] = useState<Period>('1M');

  const tint = useThemeColor({}, 'tint');
  const bg = useThemeColor({}, 'background');
  const iconColor = useThemeColor({}, 'icon');
  const screenWidth = Dimensions.get('window').width;

  const filteredEntries = useMemo(() => {
    const start = getStartDate(period);
    return entries.filter((e) => new Date(e.date + 'T00:00:00') >= start);
  }, [entries, period]);

  const chartData = useMemo(() => {
    if (filteredEntries.length === 0) return [];

    // For 1Y, show ~12 labels; for 1M, ~6; for 1W, all 7
    const labelInterval =
      period === '1Y'
        ? Math.max(1, Math.floor(filteredEntries.length / 12))
        : period === '1M'
          ? Math.max(1, Math.floor(filteredEntries.length / 6))
          : 1;

    return filteredEntries.map((entry, i) => ({
      value: entry.weight,
      label: i % labelInterval === 0 ? formatLabel(entry.date, period) : '',
      dataPointText: '',
    }));
  }, [filteredEntries, period]);

  const { minVal, maxVal } = useMemo(() => {
    if (filteredEntries.length === 0) return { minVal: 0, maxVal: 100 };
    const weights = filteredEntries.map((e) => e.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const padding = Math.max((max - min) * 0.2, 2);
    return {
      minVal: Math.floor(min - padding),
      maxVal: Math.ceil(max + padding),
    };
  }, [filteredEntries]);

  const spacing = useMemo(() => {
    if (chartData.length <= 1) return 50;
    const available = screenWidth - 80;
    return Math.min(50, Math.max(20, available / (chartData.length - 1)));
  }, [chartData.length, screenWidth]);

  return (
    <View style={styles.container}>
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriod(p)}
            style={[
              styles.periodButton,
              { backgroundColor: period === p ? tint : 'transparent' },
            ]}>
            <ThemedText
              style={[
                styles.periodText,
                { color: period === p ? bg : iconColor },
              ]}>
              {p}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {chartData.length < 2 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: iconColor }]}>
            {chartData.length === 0
              ? 'No entries yet for this period'
              : 'Add one more entry to see the chart'}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          <LineChart
            data={chartData}
            curved
            curveType={0}
            areaChart
            hideDataPoints={chartData.length > 14}
            dataPointsColor={tint}
            dataPointsRadius={4}
            color={tint}
            startFillColor={tint}
            endFillColor={tint}
            startOpacity={0.25}
            endOpacity={0.02}
            thickness={2.5}
            yAxisTextStyle={{ color: iconColor, fontSize: 11 }}
            xAxisLabelTextStyle={{
              color: iconColor,
              fontSize: 10,
              width: 50,
              textAlign: 'center',
            }}
            yAxisColor="transparent"
            xAxisColor={iconColor + '30'}
            rulesColor={iconColor + '20'}
            spacing={spacing}
            maxValue={maxVal - minVal}
            yAxisOffset={minVal}
            noOfSections={4}
            height={180}
            width={screenWidth - 70}
            adjustToWidth={false}
            isAnimated
            animationDuration={600}
            pointerConfig={{
              pointerStripColor: iconColor + '40',
              pointerStripWidth: 1,
              pointerColor: tint,
              radius: 5,
              pointerLabelWidth: 80,
              pointerLabelHeight: 30,
              pointerLabelComponent: (items: { value: number }[]) => (
                <View style={[styles.pointerLabel, { backgroundColor: tint }]}>
                  <ThemedText style={[styles.pointerText, { color: bg }]}>
                    {items[0].value.toFixed(1)} {unit}
                  </ThemedText>
                </View>
              ),
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  chartWrapper: {
    marginLeft: -10,
  },
  pointerLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointerText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
