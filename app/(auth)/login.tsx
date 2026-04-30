import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../src/lib/hooks';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
  KineticInput,
} from '../../src/components/ui/KineticPrimitives';
import { kineticPalette } from '../../src/theme/kinetic';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.');
      return;
    }

    try {
      const nextUser = await login(email.trim(), password);
      router.replace(
        nextUser?.onboardingCompleted
          ? '/(tabs)'
          : { pathname: '/onboarding/learning', params: { mode: 'profileSetup' } }
      );
    } catch (error: any) {
      Alert.alert('Đăng nhập thất bại', error?.response?.data?.error || 'Vui lòng thử lại.');
    }
  };

  return (
    <View style={styles.container}>
      <KineticBackdrop />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={styles.brand}>LexiWake</Text>
            <Text style={styles.heroTitle}>
              Mỗi từ vựng là một<Text style={styles.heroHighlight}> cánh cửa</Text> mới.
            </Text>
            <KineticGlassCard style={styles.quoteCard}>
              <Text style={styles.quoteText}>
                Đăng nhập để đồng bộ alarm, tiến độ học và thư viện cá nhân trên backend.
              </Text>
            </KineticGlassCard>
          </View>

          <View style={styles.formSection}>
            <View style={styles.header}>
              <Text style={styles.title}>Đăng nhập</Text>
              <Text style={styles.subtitle}>
                Chào mừng bạn quay lại với hành trình học từ vựng qua báo thức.
              </Text>
            </View>

            <View style={styles.form}>
              <KineticInput
                label="Email"
                icon="📧"
                placeholder="example@gmail.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <KineticInput
                label="Mật khẩu"
                icon="🔒"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={styles.helperLink}>Quên mật khẩu?</Text>
              </TouchableOpacity>

              <KineticButton onPress={handleLogin} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <KineticButtonText>Đăng nhập</KineticButtonText>
                )}
              </KineticButton>

              <KineticButton variant="secondary" onPress={() => router.push('/(auth)/guest')}>
                <KineticButtonText variant="secondary">Dùng thử với chế độ khách</KineticButtonText>
              </KineticButton>
            </View>

            <TouchableOpacity style={styles.footerRow} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerText}>Chưa có tài khoản?</Text>
              <Text style={styles.footerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kineticPalette.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 24,
  },
  hero: {
    borderRadius: 32,
    backgroundColor: kineticPalette.primary,
    padding: 24,
    gap: 18,
    overflow: 'hidden',
  },
  brand: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    fontStyle: 'italic',
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    color: '#ffffff',
  },
  heroHighlight: {
    color: kineticPalette.secondaryContainer,
  },
  quoteCard: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  quoteText: {
    color: kineticPalette.onPrimaryContainer,
    fontSize: 15,
    lineHeight: 22,
  },
  formSection: {
    borderRadius: 32,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 22,
    gap: 22,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
  },
  form: {
    gap: 16,
  },
  helperLink: {
    alignSelf: 'flex-end',
    fontSize: 13,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: kineticPalette.onSurfaceVariant,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
});
