import { View } from 'react-native';
import { GlassPanel, Icon, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import type { SceneProps } from './Scene';

// Fallback bundlado pelo Metro no target web. Evita que `@react-three/fiber/native`
// e `expo-gl` (que dependem de bindings nativos / DOM Image) sejam importados,
// o que causa tela branca silenciosa no React Native Web. Mesmo padrão de
// `app/(tabs)/map.web.tsx`.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Vehicle3DWebFallback(_props: SceneProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bgBase,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.lg,
      }}
    >
      <GlassPanel
        padding="lg"
        style={{ gap: theme.spacing.md, alignItems: 'center', maxWidth: 360 }}
      >
        <Icon name="cube-outline" size={48} color="muted" />
        <Text variant="h2" style={{ textAlign: 'center' }}>
          3D indisponível no Web
        </Text>
        <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
          A visualização 3D interativa do veículo está disponível apenas no
          aplicativo mobile (iOS e Android).
        </Text>
      </GlassPanel>
    </View>
  );
}
