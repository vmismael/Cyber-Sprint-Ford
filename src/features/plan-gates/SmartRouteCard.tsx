import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { GlassPanel, Icon, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';

export function SmartRouteCard() {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ver rota inteligente no mapa"
      onPress={() => router.push('/(tabs)/map')}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <GlassPanel
        padding="lg"
        style={{
          gap: theme.spacing.sm,
          borderColor: theme.plan.accent + '55',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: theme.radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.plan.accentSoft,
            }}
          >
            <Icon name="navigate-outline" size={18} color="accent" />
          </View>
          <Text
            variant="caption"
            color="accent"
            style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}
          >
            Rota inteligente · Urban
          </Text>
        </View>
        <Text variant="h3">Chegue 8 min antes</Text>
        <Text variant="body" color="muted">
          Trânsito leve via Av. Faria Lima · pedágio reduzido. Toque para abrir no mapa.
        </Text>
      </GlassPanel>
    </Pressable>
  );
}
