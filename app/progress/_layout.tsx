import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function ProgressLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f8f9fa' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="streak" />
        <Stack.Screen name="trophies" />
      </Stack>
    </>
  );
}
