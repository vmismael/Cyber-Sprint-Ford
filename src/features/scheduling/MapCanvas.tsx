import { forwardRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type MapPressEvent,
  type Region,
} from 'react-native-maps';
import { darkMapStyle } from '@/features/scheduling/mapStyle';
import { DealerPin } from '@/features/scheduling/DealerPin';
import type { Dealer } from '@/types/scheduling';

// INVARIANTE: este componente e carregado por React.lazy em app/(tabs)/map.tsx.
// Existe um gap de ~1 frame entre o Suspense fallback e o resolve do chunk
// onde mapRef.current === null. Todos os call sites de mapRef devem usar
// optional chaining (`mapRef.current?.animateToRegion(...)`) — nunca acesso
// direto. Quebrar essa invariante causa NPE no primeiro toque pos-cold-start.

export type MapCanvasProps = {
  initialRegion: Region;
  dealers: Dealer[];
  selectedId: string | null;
  trackingId: string | null;
  initialTracking: boolean;
  mapPadding: { top: number; bottom: number; left: number; right: number };
  onMarkerPress: (dealer: Dealer) => void;
  onPress: (e: MapPressEvent) => void;
};

const MapCanvas = forwardRef<MapView, MapCanvasProps>(function MapCanvas(
  {
    initialRegion,
    dealers,
    selectedId,
    trackingId,
    initialTracking,
    mapPadding,
    onMarkerPress,
    onPress,
  },
  ref,
) {
  return (
    <MapView
      ref={ref}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegion}
      customMapStyle={darkMapStyle}
      showsCompass={false}
      showsPointsOfInterest={false}
      showsBuildings={false}
      toolbarEnabled={false}
      mapPadding={mapPadding}
      onPress={onPress}
    >
      {dealers.map((dealer) => (
        <Marker
          key={dealer.id}
          coordinate={dealer.coords}
          onPress={() => onMarkerPress(dealer)}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={initialTracking || trackingId === dealer.id}
        >
          <DealerPin
            selected={selectedId === dealer.id}
            hasPromotion={dealer.promotions.length > 0}
          />
        </Marker>
      ))}
    </MapView>
  );
});

export default MapCanvas;
