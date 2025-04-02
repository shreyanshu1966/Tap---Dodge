import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Add this near the top of your App.tsx file
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// This disables strict mode warnings
configureReanimatedLogger({
  level: ReanimatedLogLevel.error, // Only show errors, not warnings
  strict: false, // Disable strict mode
});

// Update to use the new location
import Navigation from './navigation';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [loaded] = useFonts({
    SpaceMono: require('./assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Navigation />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}