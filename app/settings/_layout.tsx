import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SettingsLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f8f9fa' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="learning" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="widget" />
        <Stack.Screen name="info" />
        <Stack.Screen name="offline" />
      </Stack>
    </>
  );
}
