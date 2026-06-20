import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/constants/theme';

export function ProgressBar({ value, color = colors.primary }: { value: number; color?: string }) {
  const normalized = Math.max(0, Math.min(1, value));
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(normalized * 100) }} style={styles.track}>
      <View style={[styles.fill, { width: `${normalized * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 9, backgroundColor: colors.line, borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill },
});
