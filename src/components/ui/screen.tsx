import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, space } from '@/constants/theme';

interface ScreenProps extends PropsWithChildren {
  footer?: ReactNode;
  contentStyle?: ViewStyle;
  scroll?: boolean;
}

export function Screen({ children, footer, contentStyle, scroll = true }: ScreenProps) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        <View style={styles.fixed}>{content}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flexGrow: 1, alignItems: 'center' },
  fixed: { flex: 1, alignItems: 'center' },
  content: { width: '100%', maxWidth: 560, paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xxl },
  footer: { borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface, alignItems: 'center' },
});
