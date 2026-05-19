import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, GlassPanel, Input, Screen, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import { requestPasswordReset } from '@/services/mocks/authApi';

const schema = z.object({
  email: z.string().min(1, 'Informe seu e-mail').email('E-mail inválido'),
});

type ForgotForm = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    const res = await requestPasswordReset({ email });
    setSentTo(res.sentTo);
  });

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, gap: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.xl }}>
          <Text variant="h1">Recuperar senha</Text>
          <Text variant="body" color="muted">
            Enviaremos um link de redefinição para o e-mail informado.
          </Text>
        </View>

        {sentTo ? (
          <GlassPanel>
            <View style={{ gap: theme.spacing.sm }}>
              <Text variant="h3" color="success">
                Tudo certo!
              </Text>
              <Text variant="body" color="muted">
                Um e-mail foi enviado para {sentTo}. Verifique sua caixa de entrada.
              </Text>
            </View>
          </GlassPanel>
        ) : (
          <View style={{ gap: theme.spacing.lg }}>
            <Input
              control={control}
              name="email"
              label="E-mail cadastrado"
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email?.message}
            />
            <Button
              label="Enviar link"
              onPress={onSubmit}
              loading={isSubmitting}
              fullWidth
            />
          </View>
        )}

        <Button
          label="Voltar para login"
          variant="ghost"
          fullWidth
          onPress={() => router.replace('/(auth)/login')}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}
