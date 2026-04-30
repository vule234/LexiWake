import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAppStore } from '../src/stores/appStore';
import BrandedSplashScreen from '../src/components/BrandedSplashScreen';

export default function SplashScreen() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const user = useAppStore((state) => state.user);
  const hasAccess = Boolean(user);
  const needsProfileSetup = Boolean(user && user.id !== 'guest' && !user.onboardingCompleted);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const timer = setTimeout(() => {
      if (!hasAccess) {
        router.replace('/onboarding');
        return;
      }

      router.replace(
        needsProfileSetup
          ? { pathname: '/onboarding/learning', params: { mode: 'profileSetup' } }
          : '/(tabs)'
      );
    }, 900);

    return () => clearTimeout(timer);
  }, [hasAccess, hasHydrated, needsProfileSetup]);

  return <BrandedSplashScreen />;
}
