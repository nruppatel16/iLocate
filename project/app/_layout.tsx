import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { locationService } from '../services/locationService';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await locationService.initialize();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="edit-shift" options={{ 
          headerShown: true, 
          title: 'Edit Shift',
          presentation: 'modal'
        }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}