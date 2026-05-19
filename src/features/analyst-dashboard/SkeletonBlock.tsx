import type { DimensionValue, ViewStyle } from 'react-native';
import { Skeleton } from '@/components/state';

export function SkeletonBlock({
  height = 16,
  width,
  style,
}: {
  height?: number;
  width?: DimensionValue;
  style?: ViewStyle;
}) {
  return <Skeleton.Block height={height} width={width} style={style} />;
}
