import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppLoadingScreen from '../src/components/AppLoadingScreen';
import AIAgentOverlayHost from '../src/components/ai/AIAgentOverlayHost';
import BrandedSplashScreen from '../src/components/BrandedSplashScreen';
import {
  ensureNotificationSetup,
  registerAlarmNotificationListeners,
} from '../src/lib/notifications';
import { useAppStore } from '../src/stores/appStore';
import '../app/global.css';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const user = useAppStore((state) => state.user);
  const hasAccess = Boolean(user);
  const needsProfileSetup = Boolean(user && user.id !== 'guest' && !user.onboardingCompleted);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const segment = segments[0];
    const childSegment = (segments as string[])[1];
    const isAuthRoute = segment === '(auth)';
    const isOnboardingRoute = segment === 'onboarding';
    const isSplashRoute = segment === 'splash';
    const isPublicRoute = isAuthRoute || isOnboardingRoute || isSplashRoute;
    const isOnboardingSuccess = isOnboardingRoute && childSegment === 'success';

    if (!hasAccess && !isPublicRoute) {
      router.replace('/onboarding');
      return;
    }

    if (hasAccess && needsProfileSetup && !isOnboardingRoute) {
      router.replace({ pathname: '/onboarding/learning', params: { mode: 'profileSetup' } });
      return;
    }

    if (hasAccess && isAuthRoute) {
      router.replace(needsProfileSetup ? { pathname: '/onboarding/learning', params: { mode: 'profileSetup' } } : '/(tabs)');
      return;
    }

    if (hasAccess && !needsProfileSetup && isOnboardingRoute && !isOnboardingSuccess) {
      router.replace('/(tabs)');
    }
  }, [hasAccess, hasHydrated, needsProfileSetup, router, segments]);

  if (hasHydrated) {
    return null;
  }

  return (
    <View style={styles.loadingOverlay}>
      <AppLoadingScreen message="Đang chuẩn bị tài khoản và dữ liệu học tập..." />
    </View>
  );
}

export default function RootLayout() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const [showStartupSplash, setShowStartupSplash] = useState(true);

  useEffect(() => {
    ensureNotificationSetup().catch((error) => {
      console.warn('Notification setup failed:', error);
    });

    let cleanup = () => {};
    registerAlarmNotificationListeners()
      .then((dispose) => {
        cleanup = dispose;
      })
      .catch((error) => {
        console.warn('Notification listener setup failed:', error);
      });

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const timer = setTimeout(() => {
      setShowStartupSplash(false);
    }, 900);

    return () => clearTimeout(timer);
  }, [hasHydrated]);

  if (hasHydrated && showStartupSplash) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <BrandedSplashScreen />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#f8f9fa' },
          }}
        >
          <Stack.Screen name="splash" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="alarm" 
            options={{ 
              headerShown: false,
              presentation: 'modal',
            }} 
          />
          <Stack.Screen 
            name="learning" 
            options={{ 
              headerShown: false,
              presentation: 'fullScreenModal',
            }} 
          />
        </Stack>
        <AuthGate />
        <AIAgentOverlayHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
});
