import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="learning" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="level" />
      <Stack.Screen name="topic" />
      <Stack.Screen name="alarm" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
