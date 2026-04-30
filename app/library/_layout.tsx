import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function LibraryLayout() {
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
        <Stack.Screen name="favorites" />
        <Stack.Screen name="word" />
        <Stack.Screen name="topic" />
        <Stack.Screen name="new" />
        <Stack.Screen name="review" />
        <Stack.Screen name="select" />
        <Stack.Screen name="picker" />
      </Stack>
    </>
  );
}
