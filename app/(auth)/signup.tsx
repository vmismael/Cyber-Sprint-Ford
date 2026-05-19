import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Screen, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/stores/useAuthStore';

const signupSchema = z
  .object({
    name: z.string().min(2, 'Informe seu nome'),
    email: z.string().min(1, 'Informe seu e-mail').email('E-mail inválido'),
    password: z.string().min(6, 'Mínimo de 6 caracteres'),
    confirm: z.string().min(6, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'As senhas não coincidem',
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupScreen() {
  const theme = useTheme();
  const router = useRouter();
  const signup = useAuthStore((s) => s.signup);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setSubmitError(null);
    try {
      await signup({ name, email, password });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Falha ao criar conta.');
    }
  });

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, gap: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.xl }}>
          <Text variant="h1">Criar conta</Text>
          <Text variant="body" color="muted">
            Comece a usar o Ford Intelligence em minutos.
          </Text>
        </View>

        <View style={{ gap: theme.spacing.lg }}>
          <Input
            control={control}
            name="name"
            label="Nome completo"
            placeholder="Como devemos te chamar?"
            autoCapitalize="words"
            error={errors.name?.message}
          />
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
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            error={errors.password?.message}
          />
          <Input
            control={control}
            name="confirm"
            label="Confirmar senha"
            placeholder="Repita a senha"
            secureTextEntry
            error={errors.confirm?.message}
          />
        </View>

        {submitError ? (
          <Text variant="caption" color="critical">
            {submitError}
          </Text>
        ) : null}

        <View style={{ gap: theme.spacing.md }}>
          <Button label="Criar conta" onPress={onSubmit} loading={isSubmitting} fullWidth />
          <Button
            label="Já tenho conta"
            variant="ghost"
            fullWidth
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: theme.spacing.xs,
          }}
        >
          <Text variant="caption" color="muted">
            Ao continuar, você concorda com os
          </Text>
          <Link href="/(auth)/login">
            <Text variant="caption" color="accent">
              Termos de uso
            </Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
