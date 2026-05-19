import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import type { ServiceKind } from '@/types/scheduling';

export type MapFilterId = 'all' | 'has-promo' | 'near-10' | ServiceKind;

export type FilterOption = {
  id: MapFilterId;
  label: string;
};

export const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'Todas' },
  { id: 'has-promo', label: 'Com promoção' },
  { id: 'near-10', label: 'Até 10km' },
  { id: 'revision', label: 'Revisão' },
  { id: 'tires', label: 'Pneus' },
  { id: 'oil-change', label: 'Óleo' },
];

export type MapFiltersBarProps = {
  selected: MapFilterId;
  onSelect: (id: MapFilterId) => void;
};

export function MapFiltersBar({ selected, onSelect }: MapFiltersBarProps) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      {FILTER_OPTIONS.map((opt) => {
        const isActive = selected === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            hitSlop={6}
            style={({ pressed }) => ({
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radius.full,
              backgroundColor: isActive ? theme.plan.accentSoft : theme.colors.surfaceGlass,
              borderWidth: 1,
              borderColor: isActive ? theme.plan.accent : theme.colors.border,
              opacity: pressed ? 0.85 : 1,
              minHeight: 36,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <View>
              <Text
                variant="caption"
                style={{
                  color: isActive ? theme.plan.accent : theme.colors.textPrimary,
                  fontFamily: theme.fontFamily.medium,
                  letterSpacing: 0.3,
                }}
              >
                {opt.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
