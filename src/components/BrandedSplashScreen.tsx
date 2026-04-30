import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import { KineticBackdrop, KineticGlassCard } from './ui/KineticPrimitives';
import { kineticPalette } from '../theme/kinetic';

export default function BrandedSplashScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 48,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KineticBackdrop variant="brand" />
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
      >
        <KineticGlassCard style={styles.logoContainer}>
          <Image
            source={require('../../assets/lexiwake-full.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </KineticGlassCard>
        <Text style={styles.appName}>LexiWake</Text>
        <View style={styles.taglineWrap}>
          <Text style={styles.tagline}>Đánh thức thói quen học từ vựng</Text>
        </View>
      </Animated.View>
      <View style={styles.footer}>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.footerText}>Đang tải kiến thức</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kineticPalette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  logoContainer: {
    width: 260,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    paddingVertical: 18,
  },
  logoImage: {
    width: 220,
    height: 220,
  },
  appName: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 14,
    letterSpacing: -1,
  },
  taglineWrap: {
    borderRadius: 999,
    backgroundColor: 'rgba(218, 215, 255, 0.16)',
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  tagline: {
    fontSize: 16,
    color: kineticPalette.onPrimaryContainer,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 72,
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    width: 180,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '44%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: kineticPalette.tertiaryFixed,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.54)',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontWeight: '700',
  },
});
