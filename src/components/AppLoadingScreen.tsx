import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

type AppLoadingScreenProps = {
  message?: string;
};

export default function AppLoadingScreen({
  message = 'Đang tải dữ liệu người dùng...',
}: AppLoadingScreenProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/lexiwake-mark.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
      <Text style={styles.title}>LexiWake</Text>
      <ActivityIndicator size="small" color="#3525cd" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 24,
    gap: 14,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#191c1d',
  },
  message: {
    maxWidth: 280,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#464555',
  },
});
