import type { ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: readonly Edge[];
  style?: ViewStyle;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
};

const DEFAULT_EDGES: readonly Edge[] = ['top', 'left', 'right'];

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = DEFAULT_EDGES,
  style,
  contentContainerStyle,
}: ScreenProps) {
  const theme = useTheme();
  const padding = padded ? theme.spacing.lg : 0;

  return (
    <SafeAreaView
      edges={edges}
      style={{ flex: 1, backgroundColor: theme.colors.bgBase }}
    >
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            {
              padding,
              paddingBottom: theme.spacing.xxxl,
              gap: theme.spacing.lg,
            },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, padding, gap: theme.spacing.lg }, style]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
