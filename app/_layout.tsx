import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { authStore } from '../store/authStore';

export default function RootLayout() {
  const { token, isLoaded, loadAuth } = authStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadAuth();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      router.replace('/(tabs)/scanner');
    }
  }, [token, isLoaded, segments]);

  return (
    <>
      <StatusBar style="light" backgroundColor="#0D5C3A" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
