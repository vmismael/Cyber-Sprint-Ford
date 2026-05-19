import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Icon, Input, Screen, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/stores/useAuthStore';
import { toSafeMessage } from '@/utils/safeError';

const loginSchema = z.object({
  email: z.string().min(1, 'Informe seu e-mail').email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

const ANALYST_BLUE = '#1F6FEB';

export default function LoginScreen() {
  const theme = useTheme();
  const login = useAuthStore((s) => s.login);
  const lockedUntil = useAuthStore((s) => s.lockedUntil);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAnalyst, setIsAnalyst] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown ticker — updates every second while lockout is active
  useEffect(() => {
    if (!lockedUntil) {
      setCountdown(0);
      return;
    }
    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      setCountdown(remaining > 0 ? remaining : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const isLocked = countdown > 0;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await login({ ...values, isAnalyst });
    } catch (err) {
      setSubmitError(toSafeMessage(err));
    }
  });

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, gap: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.xl }}>
          <Text variant="h1">Bem-vindo</Text>
          <Text variant="body" color="muted">
            Acesse sua conta Ford Intelligence.
          </Text>
        </View>

        <View
          style={{
            gap: theme.spacing.lg,
            borderWidth: isAnalyst ? 1 : 0,
            borderColor: isAnalyst ? ANALYST_BLUE : 'transparent',
            borderRadius: theme.radius.lg,
            padding: isAnalyst ? theme.spacing.lg : 0,
          }}
        >
          <Input
            control={control}
            name="email"
            label="E-mail"
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email?.message}
          />
          <Input
            control={control}
            name="password"
            label="Senha"
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            error={errors.password?.message}
          />
        </View>

        {/* Lockout message takes priority over generic submit error */}
        {isLocked ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.xs,
              backgroundColor: 'rgba(229,72,77,0.10)',
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
            }}
            accessibilityLiveRegion="polite"
            accessibilityLabel={`Conta bloqueada. Tente novamente em ${countdown} segundos`}
          >
            <Icon name="lock-closed" size={14} color="critical" />
            <Text variant="caption" color="critical">
              Muitas tentativas. Tente novamente em{' '}
              <Text variant="caption" color="critical" style={{ fontWeight: '700' }}>
                {countdown}s
              </Text>
            </Text>
          </View>
        ) : submitError ? (
          <Text variant="caption" color="critical">
            {submitError}
          </Text>
        ) : null}

        <View style={{ gap: theme.spacing.md }}>
          <Button
            label={isLocked ? `Bloqueado (${countdown}s)` : 'Entrar'}
            onPress={onSubmit}
            loading={isSubmitting}
            disabled={isLocked}
            fullWidth
          />
          <Link href="/(auth)/forgot-password" asChild>
            <Button label="Esqueci minha senha" variant="ghost" fullWidth />
          </Link>
        </View>

        <Pressable
          onPress={() => setIsAnalyst((v) => !v)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            opacity: pressed ? 0.7 : 1,
            alignSelf: 'center',
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.radius.full,
            borderWidth: 1,
            borderColor: isAnalyst ? ANALYST_BLUE : theme.colors.border,
            backgroundColor: isAnalyst
              ? 'rgba(31,111,235,0.10)'
              : 'transparent',
          })}
          accessibilityRole="checkbox"
          accessibilityLabel="Entrar como Analista Ford"
          accessibilityState={{ checked: isAnalyst }}
        >
          <Icon
            name={isAnalyst ? 'shield-checkmark' : 'shield-outline'}
            size={16}
            color={isAnalyst ? 'accent' : 'muted'}
          />
          <Text
            variant="caption"
            color={isAnalyst ? 'accent' : 'muted'}
          >
            {isAnalyst ? 'Modo Analista Ford ativo' : 'Entrar como Analista Ford'}
          </Text>
        </Pressable>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: theme.spacing.xs,
            marginTop: theme.spacing.lg,
          }}
        >
          <Text variant="body" color="muted">
            Não tem conta?
          </Text>
          <Link href="/(auth)/signup">
            <Text variant="bodyStrong" color="accent">
              Criar conta
            </Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
