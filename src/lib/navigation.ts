import { router } from 'expo-router';

export function goBackOrReplace(fallback = '/(tabs)') {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback as any);
}
