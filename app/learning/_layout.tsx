import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function LearningLayout() {
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
        <Stack.Screen name="flashcard" />
        <Stack.Screen name="meaning" />
        <Stack.Screen name="quiz/audio" />
        <Stack.Screen name="quiz/multiple-choice" />
        <Stack.Screen name="quiz/input" />
        <Stack.Screen name="complete" />
      </Stack>
    </>
  );
}
