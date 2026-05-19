import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Icon, Text, type IconName } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';

export type OptionCardProps = {
  icon: IconName;
  title: string;
  description?: string;
  selected: boolean;
  badge?: string;
  badgeTone?: 'accent' | 'info' | 'success' | 'neutral';
  onPress: () => void;
  children?: ReactNode;
};

export function OptionCard({
  icon,
  title,
  description,
  selected,
  badge,
  badgeTone = 'accent',
  onPress,
  children,
}: OptionCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      style={({ pressed }) => ({
        backgroundColor: selected ? theme.plan.accentSoft : theme.colors.bgElevated,
        borderColor: selected ? theme.plan.accent : theme.colors.border,
        borderWidth: selected ? 2 : 1,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        opacity: pressed ? 0.9 : 1,
        gap: theme.spacing.sm,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selected ? theme.plan.accent : theme.colors.bgBase,
          }}
        >
          <Icon name={icon} size={20} color={selected ? 'inverse' : 'muted'} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" style={{ color: selected ? theme.plan.accent : theme.colors.textPrimary }}>
            {title}
          </Text>
          {description ? (
            <Text variant="caption" color="muted">
              {description}
            </Text>
          ) : null}
        </View>
        {badge ? <Badge label={badge} tone={badgeTone} /> : null}
      </View>
      {children}
    </Pressable>
  );
}
