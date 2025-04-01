import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from '@/hooks/useColorScheme';

// Import your screens
import HomeScreen from '@/screens/HomeScreen';
import GameScreen from '@/screens/GameScreen';
import InstructionsScreen from '@/screens/InstructionsScreen';
import StatsScreen from '@/screens/StatsScreen';
import NotFoundScreen from '@/screens/NotFoundScreen';

// Create stack navigator
const Stack = createNativeStackNavigator();

export default function Navigation() {
  const colorScheme = useColorScheme();

  return (
    <NavigationContainer
      theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Game" 
          component={GameScreen} 
          options={{ 
            headerShown: true,
            title: 'Tap & Dodge' 
          }} 
        />
        <Stack.Screen 
          name="Instructions" 
          component={InstructionsScreen} 
          options={{ 
            headerShown: true,
            title: 'How To Play' 
          }} 
        />
        <Stack.Screen 
          name="Stats" 
          component={StatsScreen} 
          options={{ 
            headerShown: true,
            title: 'Game Statistics' 
          }} 
        />
        <Stack.Screen 
          name="NotFound" 
          component={NotFoundScreen} 
          options={{ title: 'Oops!' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}