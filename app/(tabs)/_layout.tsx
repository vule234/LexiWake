import { Tabs } from 'expo-router';
import KineticTabBar from '../../src/components/navigation/KineticTabBar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={(props) => <KineticTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tutor" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
