import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { forgotPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Thiếu email', 'Vui lòng nhập email của bạn.');
      return;
    }

    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (error: any) {
      Alert.alert('Không thể gửi yêu cầu', error?.response?.data?.error || 'Vui lòng thử lại.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <KineticBackdrop />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Quên mật khẩu?</Text>
        <Text style={styles.subtitle}>
          Nhập email của bạn. Ở bản đồ án này, hệ thống trả phản hồi xác nhận chung để giữ an toàn thông tin tài khoản.
        </Text>

        <View style={styles.formCard}>
          <KineticInput
            label="Địa chỉ email"
            icon="📧"
            placeholder="example@gmail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <KineticButton onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <KineticButtonText>Gửi yêu cầu đặt lại</KineticButtonText>
            )}
          </KineticButton>

          {submitted ? (
            <Text style={styles.successText}>
              Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được chuẩn bị.
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kineticPalette.background,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: kineticPalette.onSurface,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 18,
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
  formCard: {
    borderRadius: 28,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 20,
    gap: 16,
  },
  successText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.secondary,
    fontWeight: '600',
  },
});
