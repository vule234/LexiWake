import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function CramLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f8f9fa' } }}>
        <Stack.Screen name="setup" />
        <Stack.Screen name="learning" />
      </Stack>
    </>
  );
}
