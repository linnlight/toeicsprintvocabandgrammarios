import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@/constants/theme';
import { uiCopy } from '@/i18n/copy';
import { useApp } from '@/state/app-provider';

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { data } = useApp();
  const copy = uiCopy[data.settings.uiLanguage].nav;
  const items = [
    { href: '/home' as const, icon: '⚡', label: copy.sprint },
    { href: '/review' as const, icon: 'A', label: copy.vocabulary },
    { href: '/grammar' as const, icon: '文', label: copy.grammar },
    { href: '/tests' as const, icon: '✓', label: copy.tests },
  ];
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      <View style={styles.nav}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} key={item.href} onPress={() => {
              if (!active) router.replace(item.href);
            }} style={styles.item}>
              <Text style={[styles.icon, active && styles.active]}>{item.icon}</Text>
              <Text style={[styles.label, active && styles.active]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', backgroundColor: colors.surface, alignItems: 'center' },
  nav: { width: '100%', maxWidth: 560, flexDirection: 'row', paddingTop: space.sm, paddingHorizontal: space.lg },
  item: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { fontSize: 22, lineHeight: 24, color: colors.muted, fontWeight: '700' },
  label: { fontSize: 11, color: colors.muted, fontWeight: '700' },
  active: { color: colors.primary },
});
