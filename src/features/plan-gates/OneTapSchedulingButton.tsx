import { useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { Button, Icon, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import type { ServiceKind } from '@/types/scheduling';
import { oneTapReasonMessage, runOneTapScheduling } from './oneTapScheduling';

function notifyError(message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message);
    return;
  }
  Alert.alert('Não foi possível agendar agora', message);
}

export type OneTapSchedulingButtonProps = {
  suggestedService?: ServiceKind;
};

export function OneTapSchedulingButton({
  suggestedService = 'revision',
}: OneTapSchedulingButtonProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await runOneTapScheduling(suggestedService);
      if (!result.ok) notifyError(oneTapReasonMessage(result.reason));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Button
        label={loading ? 'Preparando…' : 'Agendar em 1 toque'}
        variant="primary"
        loading={loading}
        iconLeft={<Icon name="flash-outline" size={18} color="inverse" />}
        onPress={handlePress}
        fullWidth
      />
      <Text variant="caption" color="muted" style={{ textAlign: 'center' }}>
        Premium · usa concessionária mais próxima e próximo horário
      </Text>
    </View>
  );
}
