import { View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Button, Screen, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';

export default function NotFoundScreen() {
  const theme = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Não encontrado' }} />
      <Screen>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.md,
          }}
        >
          <Text variant="h1">404</Text>
          <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
            A tela que você procura não existe ou foi movida.
          </Text>
          <Link href="/(tabs)" asChild>
            <Button label="Voltar para o início" />
          </Link>
        </View>
      </Screen>
    </>
  );
}
