import { ScrollView, Pressable, View } from 'react-native';
import { Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function Chip({ label, selected, onPress }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: selected ? theme.colors.fordBlueLight : theme.colors.border,
        backgroundColor: selected ? 'rgba(31,111,235,0.15)' : theme.colors.bgElevated,
        opacity: pressed ? 0.75 : 1,
      })}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text
        variant="caption"
        style={{
          color: selected ? theme.colors.fordBlueLight : theme.colors.textMuted,
          fontWeight: selected ? '600' : '400',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface FilterChipRowProps {
  label: string;
  options: { key: string; label: string }[];
  selected: string;
  onSelect: (key: string) => void;
}

export function FilterChipRow({ label, options, selected, onSelect }: FilterChipRowProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text
        variant="caption"
        color="muted"
        style={{ textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: theme.spacing.xs }}
      >
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing.sm, paddingHorizontal: theme.spacing.xs }}
      >
        {options.map((opt) => (
          <Chip
            key={opt.key}
            label={opt.label}
            selected={selected === opt.key}
            onPress={() => onSelect(opt.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
