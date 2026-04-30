import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../src/lib/hooks';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticInput,
} from '../../src/components/ui/KineticPrimitives';
import { kineticPalette } from '../../src/theme/kinetic';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin đăng ký.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mật khẩu không khớp', 'Vui lòng nhập lại xác nhận mật khẩu.');
      return;
    }

    try {
      await register(email.trim(), password, fullName.trim());
      router.replace({ pathname: '/onboarding/learning', params: { mode: 'profileSetup' } });
    } catch (error: any) {
      Alert.alert('Đăng ký thất bại', error?.response?.data?.error || 'Vui lòng thử lại.');
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
          <View style={styles.header}>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>
              Tạo tài khoản để đồng bộ tiến độ, phạm vi học và báo thức của bạn giữa các thiết bị.
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Thiết lập của bạn</Text>
            <Text style={styles.summaryText}>
              Bộ từ: sẽ chọn sau khi đăng nhập
            </Text>
            <Text style={styles.summaryText}>
              Sau khi tạo tài khoản, bạn sẽ cấu hình nhịp học và alarm đầu tiên.
            </Text>
          </View>

          <View style={styles.form}>
            <KineticInput
              label="Họ và tên"
              icon="👤"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChangeText={setFullName}
            />

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

            <KineticInput
              label="Xác nhận mật khẩu"
              icon="🔐"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <KineticButton onPress={handleRegister} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <KineticButtonText>Tạo tài khoản</KineticButtonText>
              )}
            </KineticButton>
          </View>

          <TouchableOpacity style={styles.footerRow} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerText}>Đã có tài khoản?</Text>
            <Text style={styles.footerLink}>Đăng nhập</Text>
          </TouchableOpacity>
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
    gap: 20,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
  },
  summaryCard: {
    borderRadius: 24,
    backgroundColor: kineticPalette.primaryFixed,
    padding: 18,
    gap: 6,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: kineticPalette.primary,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.primaryContainer,
    fontWeight: '600',
  },
  form: {
    borderRadius: 28,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 20,
    gap: 16,
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
