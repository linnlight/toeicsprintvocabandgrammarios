import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors, radii, space } from '@/constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, style, accessibilityHint }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], isDisabled && styles.disabled, pressed && !isDisabled && styles.pressed, style]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.ink : colors.primary} /> : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 54, borderRadius: radii.md, paddingHorizontal: space.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  primary: { backgroundColor: colors.lime, borderColor: colors.limeDark },
  secondary: { backgroundColor: colors.surface, borderColor: colors.line },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  danger: { backgroundColor: colors.dangerSoft, borderColor: '#F0C6C2' },
  label: { fontSize: 16, fontWeight: '800', letterSpacing: 0.1 },
  primaryLabel: { color: colors.ink },
  secondaryLabel: { color: colors.primaryDark },
  ghostLabel: { color: colors.primary },
  dangerLabel: { color: colors.danger },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
});
