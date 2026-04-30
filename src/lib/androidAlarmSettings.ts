import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const appPackage = Constants.expoConfig?.android?.package || 'com.vocabalarm.app';
const packageUri = `package:${appPackage}`;

const openApplicationDetails = async () => {
  if (Platform.OS === 'android') {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
      { data: packageUri }
    );
    return;
  }

  await Linking.openSettings();
};

export async function openExactAlarmSettings() {
  if (Platform.OS !== 'android') {
    await Linking.openSettings();
    return;
  }

  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.REQUEST_SCHEDULE_EXACT_ALARM,
      { data: packageUri }
    );
  } catch {
    await openApplicationDetails();
  }
}

export async function openFullScreenIntentSettings() {
  if (Platform.OS !== 'android') {
    await Linking.openSettings();
    return;
  }

  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.MANAGE_APP_USE_FULL_SCREEN_INTENT,
      { data: packageUri }
    );
  } catch {
    await openApplicationDetails();
  }
}

export async function openNotificationSettings() {
  if (Platform.OS !== 'android') {
    await Linking.openSettings();
    return;
  }

  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.APP_NOTIFICATION_SETTINGS,
      {
        extra: {
          'android.provider.extra.APP_PACKAGE': appPackage,
        },
      }
    );
  } catch {
    await openApplicationDetails();
  }
}

export const canShowAndroidAlarmSettings = Platform.OS === 'android';
