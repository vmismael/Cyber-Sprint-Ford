import { ActivityIndicator, View } from 'react-native';

// Neutral landing screen — rendered for a single frame while useProtectedRoute
// determines the correct destination (analyst dashboard, tabs, or login).
// Never shows content; exists solely to give the router a stable initial route
// that doesn't leak client UI to analyst sessions on cold start.
export default function RootIndex() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E14' }}>
      <ActivityIndicator style={{ flex: 1 }} color="#1F6FEB" />
    </View>
  );
}
