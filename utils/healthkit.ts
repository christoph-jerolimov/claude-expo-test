import { Platform } from 'react-native';

export function isHealthKitAvailable(): boolean {
  return Platform.OS === 'ios';
}

export async function requestHealthKitPermissions(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;

  try {
    const AppleHealthKit = require('react-native-health').default;
    const permissions = {
      permissions: {
        write: [AppleHealthKit.Constants.Permissions.Weight],
        read: [AppleHealthKit.Constants.Permissions.Weight],
      },
    };

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error: unknown) => {
        resolve(!error);
      });
    });
  } catch {
    // Native module not available (e.g. Expo Go)
    return false;
  }
}

export async function writeWeightToHealthKit(
  weight: number,
  unit: 'kg' | 'lbs',
  date: Date,
): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const AppleHealthKit = require('react-native-health').default;
    const options = {
      value: weight,
      unit: unit === 'kg' ? 'gram' : 'pound',
      startDate: date.toISOString(),
    };

    // Convert kg to grams for HealthKit
    if (unit === 'kg') {
      options.value = weight * 1000;
    }

    return new Promise((resolve, reject) => {
      AppleHealthKit.saveWeight(
        options,
        (error: unknown, _result: unknown) => {
          if (error) reject(error);
          else resolve();
        },
      );
    });
  } catch {
    // Native module not available
  }
}
