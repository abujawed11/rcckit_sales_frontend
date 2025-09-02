import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

import { AuthProvider } from '@/context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as NavigationBar from 'expo-navigation-bar';
import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Network recovery & retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for network/server errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      
      // Network recovery settings
      refetchOnWindowFocus: true, // Refetch when app regains focus
      refetchOnReconnect: true, // 🔥 KEY: Refetch when network reconnects
      
      // Stale time settings
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - cache retention (renamed from cacheTime in v5)
      
      // Network mode
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      retry: 1, // Retry mutations once on network failure
      networkMode: 'online',
    },
  },
});

// Utility function to hide navigation bar
const hideNavigationBar = async () => {
  if (Platform.OS === 'android') {
    try {
      await NavigationBar.setBehaviorAsync('inset-swipe');
      await NavigationBar.setVisibilityAsync('hidden');
    } catch (e) {
      console.log('Failed to hide navigation bar:', e);
    }
  }
};

export default function RootLayout() {
  useEffect(() => {
    const setupApp = async () => {
      // Setup notifications

      if (Platform.OS === 'android') {

        // Configure Android navigation bar: persistent hidden state
        try {
          // Set dark background and light buttons
          await NavigationBar.setBackgroundColorAsync('#0a0a0a');
          await NavigationBar.setButtonStyleAsync('light');

          // Set behavior BEFORE setting visibility for better stability
          await NavigationBar.setBehaviorAsync('inset-swipe');
          await NavigationBar.setVisibilityAsync('hidden');
          
          // Force hide again after a small delay to ensure it sticks
          setTimeout(async () => {
            try {
              await NavigationBar.setVisibilityAsync('hidden');
            } catch (retryError) {
              console.log('Navigation bar retry hide failed:', retryError);
            }
          }, 500);
        } catch (e) {
          console.log('Navigation bar configuration failed:', e);
        }
      }
    };

    setupApp();

    // 🔥 Setup network listener for auto-refetch on reconnect

    // 🔥 Listen for app state changes to re-hide navigation bar
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Re-hide navigation bar when app becomes active
        setTimeout(() => {
          hideNavigationBar();
        }, 100);
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <Slot />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}