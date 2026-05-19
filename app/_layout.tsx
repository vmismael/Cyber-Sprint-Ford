import { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { RootErrorBoundary } from '@/components/RootErrorBoundary';
import { PlanSwitchPulse } from '@/features/plan-gates/PlanSwitchPulse';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUserStore } from '@/stores/useUserStore';
import { usePlanStore } from '@/stores/usePlanStore';
import { useSchedulingStore } from '@/stores/useSchedulingStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { startCriticalAlertHapticListener } from '@/stores/criticalAlertHapticListener';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync().catch(() => {
  // hideAsync may already be running on some platforms; ignore.
});

function RootNavigator() {
  useProtectedRoute();
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(analyst)" />
      <Stack.Screen
        name="_dev/design-system"
        options={{
          headerShown: true,
          title: 'Design System',
          headerStyle: { backgroundColor: '#0A0E14' },
          headerTintColor: '#F5F7FA',
        }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const status = useAuthStore((s) => s.status);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateUser = useUserStore((s) => s.hydrate);
  const hydrateScheduling = useSchedulingStore((s) => s.hydrate);
  const hydrateWallet = useWalletStore((s) => s.hydrate);
  const userHydrated = useUserStore((s) => s.hydrated);
  const schedulingHydrated = useSchedulingStore((s) => s.hydrated);
  const walletHydrated = useWalletStore((s) => s.hydrated);
  const userProfile = useUserStore((s) => s.profile);
  const setPlan = usePlanStore((s) => s.setPlan);
  const [hydrated, setHydrated] = useState(false);
  const hydrateOnce = useRef(false);

  useEffect(() => {
    if (!hydrateOnce.current && status === 'idle') {
      hydrateOnce.current = true;
      hydrateAuth();
      hydrateUser();
      hydrateScheduling();
      hydrateWallet();
    }
  }, [status, hydrateAuth, hydrateUser, hydrateScheduling, hydrateWallet]);

  useEffect(() => {
    if (userProfile?.plan) {
      setPlan(userProfile.plan);
    }
  }, [userProfile?.plan, setPlan]);

  useEffect(() => startCriticalAlertHapticListener(), []);

  useEffect(() => {
    const authReady = status === 'authenticated' || status === 'unauthenticated';
    if (!hydrated && authReady && userHydrated && schedulingHydrated && walletHydrated) {
      setHydrated(true);
    }
  }, [status, userHydrated, schedulingHydrated, walletHydrated, hydrated]);

  const ready = (fontsLoaded || fontError) && hydrated;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootErrorBoundary>
            <RootNavigator />
            <PlanSwitchPulse />
          </RootErrorBoundary>
          <StatusBar style="light" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
