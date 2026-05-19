import { View } from 'react-native';
import { GlassPanel, Icon, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';

export default function MapWebFallback() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgBase, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg }}>
      <GlassPanel padding="lg" style={{ gap: theme.spacing.md, alignItems: 'center', maxWidth: 340 }}>
        <Icon name="map-outline" size={48} color="muted" />
        <Text variant="h2" style={{ textAlign: 'center' }}>Mapa indisponível no Web</Text>
        <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
          O mapa de concessionárias está disponível apenas no app iOS e Android.
        </Text>
      </GlassPanel>
    </View>
  );
}
