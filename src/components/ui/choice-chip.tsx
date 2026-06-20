import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, space } from '@/constants/theme';

export function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { minWidth: 74, minHeight: 46, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  label: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  selectedLabel: { color: colors.primaryDark },
  pressed: { opacity: 0.75 },
});
