import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';

export type StepHeaderProps = {
  total: number;
  current: number;
  title: string;
  subtitle?: string;
  showBack?: boolean;
};

export function StepHeader({
  total,
  current,
  title,
  subtitle,
  showBack = true,
}: StepHeaderProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        {showBack ? (
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/map');
              }
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={({ pressed }) => ({
              width: theme.touchTarget.min,
              height: theme.touchTarget.min,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Icon name="chevron-back" size={24} color="primary" />
          </Pressable>
        ) : (
          <View style={{ width: theme.touchTarget.min }} />
        )}
        <Text variant="caption" color="muted" style={{ flex: 1 }}>
          Passo {current} de {total}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
        {Array.from({ length: total }).map((_, idx) => {
          const reached = idx < current;
          return (
            <View
              key={idx}
              style={{
                flex: 1,
                height: 4,
                borderRadius: theme.radius.full,
                backgroundColor: reached ? theme.plan.accent : theme.colors.border,
              }}
            />
          );
        })}
      </View>

      <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
        <Text variant="h2">{title}</Text>
        {subtitle ? (
          <Text variant="body" color="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
