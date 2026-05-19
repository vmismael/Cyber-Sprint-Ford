import type { MapStyleElement } from 'react-native-maps';

export const darkMapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#0A0E14' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8A93A6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0E14' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#C7CDD8' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6C7486' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#13201F' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#13171F' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1B2230' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9CA3AF' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1F6FEB' }, { saturation: -65 }, { lightness: -55 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#B0B8C8' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#13171F' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#06121E' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3F5067' }],
  },
];
