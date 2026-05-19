import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUserStore } from '@/stores/useUserStore';

export function useProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const userHydrated = useUserStore((s) => s.hydrated);
  const onboardingComplete = useUserStore((s) => s.onboardingComplete);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated' && status !== 'unauthenticated') return;
    if (!userHydrated) return;

    const isAuthenticated = status === 'authenticated';
    const inAuthGroup    = segments[0] === '(auth)';
    const inOnboarding   = inAuthGroup && segments[1] === 'onboarding';
    const inAnalystGroup = (segments[0] as string) === '(analyst)';

    if (!isAuthenticated) {
      // Cover the neutral index screen and any leaked analyst/tabs route
      if (!inAuthGroup || inOnboarding) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Analyst role — skip onboarding, route directly to analyst area
    if (user?.role === 'analyst') {
      if (!inAnalystGroup) {
        router.replace('/(analyst)/dashboard' as never);
      }
      return;
    }

    // Client role — onboarding gate
    if (!onboardingComplete) {
      if (!inOnboarding) {
        router.replace('/(auth)/onboarding/step-1');
      }
      return;
    }

    // Authenticated client. Lista de rotas/grupos onde o cliente NAO deve estar:
    // - (auth)/* e (analyst)/* — territorios de outras roles ou estados.
    // - app/index — rota neutra de cold-start, deve ser resolvida ate tabs.
    // Telas de detalhe legitimas do cliente (vehicle, scheduling, wallet/coupon)
    // vivem fora de (tabs) por design (sem tab bar) e NAO devem ser interrompidas.
    // segments=[] na rota raiz (`app/index.tsx`); segments[0] vira undefined
    // e o cast escapa do union literal estrito gerado pelos typed routes.
    const firstSegment = segments[0] as string | undefined;
    const isNeutralIndex = firstSegment === undefined;
    if (inAuthGroup || inAnalystGroup || isNeutralIndex) {
      router.replace('/(tabs)');
    }
  }, [status, user, userHydrated, onboardingComplete, segments, router]);
}
