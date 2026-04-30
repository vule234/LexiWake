import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { kineticPalette, kineticShadow } from '../../theme/kinetic';

const tabMeta: Record<string, { label: string; icon: string; tone: string }> = {
  index: { label: 'Trang chủ', icon: '🏡', tone: 'rgba(255, 221, 184, 0.7)' },
  tutor: { label: 'Trợ lý', icon: '🤖', tone: 'rgba(226, 223, 255, 0.85)' },
  library: { label: 'Thư viện', icon: '📚', tone: 'rgba(208, 239, 255, 0.85)' },
  progress: { label: 'Tiến độ', icon: '🌱', tone: 'rgba(220, 252, 231, 0.95)' },
  settings: { label: 'Cài đặt', icon: '⚙️', tone: 'rgba(241, 245, 249, 0.95)' },
};

export default function KineticTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.shell}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const meta = tabMeta[route.name] || {
            label: route.name,
            icon: '•',
            tone: 'rgba(241, 245, 249, 0.95)',
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
              onLongPress={onLongPress}
              onPress={onPress}
              activeOpacity={0.9}
              style={[styles.item, isFocused && styles.itemActive]}
            >
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: meta.tone },
                  isFocused && styles.iconBadgeActive,
                ]}
              >
                <Text style={[styles.icon, isFocused && styles.iconActive]}>{meta.icon}</Text>
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>{meta.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 18,
    backgroundColor: 'transparent',
  },
  shell: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 8,
    shadowColor: kineticPalette.primary,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 14,
  },
  item: {
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 22,
    gap: 6,
  },
  itemActive: {
    backgroundColor: kineticPalette.primary,
    transform: [{ translateY: -6 }],
    ...kineticShadow,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  icon: {
    fontSize: 18,
    color: kineticPalette.outline,
  },
  iconActive: {
    color: '#ffffff',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: kineticPalette.outline,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#ffffff',
  },
});
