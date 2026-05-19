import { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Button, Icon, Screen, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import { haptic } from '@/utils/haptics';

export default function SchedulingSuccessStep() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ protocol?: string }>();
  const protocol = typeof params.protocol === 'string' ? params.protocol : '—';

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    haptic.success();
    scale.value = withSequence(
      withTiming(1.15, { duration: 280 }),
      withSpring(1, { damping: 10 }),
    );
    opacity.value = withDelay(120, withTiming(1, { duration: 240 }));
  }, [scale, opacity]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.lg }}>
        <Animated.View
          style={[
            {
              width: 96,
              height: 96,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${theme.colors.success}26`,
              borderWidth: 2,
              borderColor: theme.colors.success,
            },
            checkStyle,
          ]}
        >
          <Icon name="checkmark" size={48} color="success" />
        </Animated.View>

        <Animated.View style={[{ alignItems: 'center', gap: theme.spacing.sm }, textStyle]}>
          <Text variant="h1" style={{ textAlign: 'center' }}>
            Agendamento confirmado!
          </Text>
          <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
            Você receberá os detalhes por notificação.
          </Text>
          <View
            style={{
              marginTop: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radius.full,
              backgroundColor: theme.plan.accentSoft,
              borderWidth: 1,
              borderColor: theme.plan.accent,
            }}
          >
            <Text variant="bodyStrong" style={{ color: theme.plan.accent, letterSpacing: 0.6 }}>
              Protocolo {protocol}
            </Text>
          </View>
        </Animated.View>
      </View>

      <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.lg }}>
        <Button
          label="Voltar para a Home"
          fullWidth
          onPress={() => router.replace('/(tabs)')}
        />
        <Button
          label="Ver no perfil"
          variant="ghost"
          fullWidth
          onPress={() => router.replace('/(tabs)/profile')}
        />
      </View>
    </Screen>
  );
}
