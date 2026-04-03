import { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';

interface WeightInputProps {
  initialValue: number;
  unit: 'kg' | 'lbs';
  onSave: (weight: number) => void;
}

export function WeightInput({ initialValue, unit, onSave }: WeightInputProps) {
  const [weight, setWeight] = useState(initialValue);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const inputRef = useRef<TextInput>(null);

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

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(weight);
  };

  return (
    <View style={styles.container}>
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
