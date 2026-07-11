import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { APP_DISPLAY_NAME } from '@/constants/app';
import { colors, space } from '@/constants/theme';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.text}>{APP_DISPLAY_NAME}…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', gap: space.md },
  text: { color: colors.muted, fontSize: 14, fontWeight: '600' },
});
