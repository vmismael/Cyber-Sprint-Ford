import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';

export type DealerPinProps = {
  selected: boolean;
  hasPromotion: boolean;
};

function DealerPinBase({ selected, hasPromotion }: DealerPinProps) {
  const theme = useTheme();
  const size = selected ? 44 : 36;

  return (
    <View style={{ width: size + 16, height: size + 16, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={[
          styles.pin,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.colors.fordBlue,
            borderColor: selected ? theme.plan.accent : theme.colors.fordBlueLight,
            borderWidth: selected ? 3 : 2,
          },
          theme.shadow.md,
        ]}
      >
        <Text
          variant="bodyStrong"
          style={{
            color: '#F5F7FA',
            fontSize: selected ? 18 : 15,
            letterSpacing: 0.5,
          }}
        >
          F
        </Text>
      </View>

      {hasPromotion ? (
        <View
          style={[
            styles.promoBadge,
            {
              backgroundColor: theme.plan.accent,
              borderColor: theme.colors.bgBase,
            },
          ]}
        >
          <Text variant="caption" style={{ color: theme.plan.accentContrast, fontSize: 10 }}>
            %
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const DealerPin = memo(DealerPinBase);

const styles = StyleSheet.create({
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
