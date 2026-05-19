import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';

function GlassTabBarBackground() {
  const theme = useTheme();
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView
        tint="dark"
        intensity={theme.blur.panel}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme.colors.surfaceGlass,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.colors.border,
          },
        ]}
      />
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.plan.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: theme.fontFamily.medium,
          fontSize: 11,
        },
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          height: Platform.select({ ios: 84, android: 68 }),
          paddingTop: theme.spacing.sm,
        },
        tabBarBackground: () => <GlassTabBarBackground />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Carteira',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
