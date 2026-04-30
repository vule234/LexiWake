import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AlarmLayout() {
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
        <Stack.Screen name="create" />
        <Stack.Screen name="edit" />
        <Stack.Screen name="lesson" />
        <Stack.Screen name="ringing" />
        <Stack.Screen name="sound" />
      </Stack>
    </>
  );
}
