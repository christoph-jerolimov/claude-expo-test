import { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = toDateString(new Date());
  const yesterday = toDateString(new Date(Date.now() - 86400000));
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

interface WeightInputProps {
  initialValue: number;
  unit: 'kg' | 'lbs';
  onSave: (weight: number, date: string) => void;
}

export function WeightInput({ initialValue, unit, onSave }: WeightInputProps) {
  const [weight, setWeight] = useState(initialValue);
  const [date, setDate] = useState(toDateString(new Date()));
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editingDate, setEditingDate] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const dateInputRef = useRef<TextInput>(null);

  const tint = useThemeColor({}, 'tint');
  const bg = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');

  const adjust = (delta: number) => {
    setWeight((prev) => Math.max(0, Math.round((prev + delta) * 10) / 10));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const startEditing = () => {
    setEditText(weight.toFixed(1));
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const finishEditing = () => {
    const parsed = parseFloat(editText);
    if (!isNaN(parsed) && parsed > 0) {
      setWeight(Math.round(parsed * 10) / 10);
    }
    setEditing(false);
    Keyboard.dismiss();
  };

  const adjustDate = (days: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setDate(toDateString(d));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const startEditingDate = () => {
    setEditingDate(true);
    setTimeout(() => dateInputRef.current?.focus(), 50);
  };

  const finishEditingDate = () => {
    setEditingDate(false);
    Keyboard.dismiss();
  };

  const handleDateChange = (text: string) => {
    // Validate YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const parsed = new Date(text + 'T00:00:00');
      if (!isNaN(parsed.getTime())) {
        setDate(text);
      }
    }
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(weight, date);
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateRow}>
        <Pressable onPress={() => adjustDate(-1)} hitSlop={8}>
          <ThemedText style={[styles.dateArrow, { color: tint }]}>{'‹'}</ThemedText>
        </Pressable>
        {editingDate ? (
          <TextInput
            ref={dateInputRef}
            style={[styles.dateLabel, { color: textColor }]}
            defaultValue={date}
            onBlur={finishEditingDate}
            onSubmitEditing={(e) => {
              handleDateChange(e.nativeEvent.text);
              finishEditingDate();
            }}
            keyboardType={Platform.OS === 'web' ? 'default' : 'numbers-and-punctuation'}
            selectTextOnFocus
          />
        ) : (
          <Pressable onPress={startEditingDate}>
            <ThemedText style={styles.dateLabel}>{formatDisplayDate(date)}</ThemedText>
          </Pressable>
        )}
        <Pressable onPress={() => adjustDate(1)} hitSlop={8}>
          <ThemedText style={[styles.dateArrow, { color: tint }]}>{'›'}</ThemedText>
        </Pressable>
      </View>

      <Pressable onPress={startEditing} style={styles.displayRow}>
        {editing ? (
          <TextInput
            ref={inputRef}
            style={[styles.weightDisplay, { color: textColor, fontFamily: Fonts?.rounded }]}
            value={editText}
            onChangeText={setEditText}
            onBlur={finishEditing}
            onSubmitEditing={finishEditing}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
        ) : (
          <ThemedText style={[styles.weightDisplay, { fontFamily: Fonts?.rounded }]}>
            {weight.toFixed(1)}
          </ThemedText>
        )}
        <ThemedText style={[styles.unitLabel, { color: iconColor }]}>{unit}</ThemedText>
      </Pressable>

      <View style={styles.adjustRow}>
        {[-1, -0.1, 0.1, 1].map((delta) => (
          <Pressable
            key={delta}
            onPress={() => adjust(delta)}
            style={({ pressed }) => [
              styles.adjustButton,
              { backgroundColor: pressed ? tint + '20' : bg, borderColor: iconColor + '40' },
            ]}>
            <ThemedText style={styles.adjustText}>
              {delta > 0 ? '+' : ''}
              {delta % 1 === 0 ? delta.toFixed(0) : delta.toFixed(1)}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleSave}
        style={({ pressed }) => [
          styles.saveButton,
          { backgroundColor: tint, opacity: pressed ? 0.85 : 1 },
        ]}>
        <ThemedText style={[styles.saveText, { color: bg }]}>Save</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dateLabel: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 120,
  },
  dateArrow: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  weightDisplay: {
    fontSize: 56,
    fontWeight: '300',
    textAlign: 'center',
    minWidth: 180,
  },
  unitLabel: {
    fontSize: 22,
    fontWeight: '500',
  },
  adjustRow: {
    flexDirection: 'row',
    gap: 10,
  },
  adjustButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  adjustText: {
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  saveText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
