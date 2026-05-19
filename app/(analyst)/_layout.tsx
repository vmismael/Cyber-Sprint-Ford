import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';

export default function AnalystLayout() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    // Guard covers both unauthenticated (user === null) and wrong role.
    if (!user || user.role !== 'analyst') {
      router.replace(user ? '/(tabs)' : '/(auth)/login');
    }
  }, [user, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
