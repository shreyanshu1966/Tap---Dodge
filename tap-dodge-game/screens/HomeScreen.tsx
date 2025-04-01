import React, { useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  withDelay
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HIGH_SCORE_KEY = '@tap_dodge_high_score';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [highScore, setHighScore] = React.useState<number | null>(null);
  
  // Animation values
  const titleScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const obstacleY = useSharedValue(-100);
  
  // Load high score when component mounts
  React.useEffect(() => {
    loadHighScore();
    startAnimations();
  }, []);
  
  // Start animations
  const startAnimations = () => {
    // Pulsing title animation
    titleScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 700 }),
        withTiming(1, { duration: 700 })
      ),
      -1, // repeat indefinitely
      true // reverse
    );
    
    // Button pulsing animation
    buttonScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1, // repeat indefinitely
      true // reverse
    );
    
    // Falling obstacle animation
    obstacleY.value = withRepeat(
      withSequence(
        withTiming(-100, { duration: 0 }),
        withDelay(
          Math.random() * 1000,
          withTiming(SCREEN_WIDTH + 100, { duration: 2000 + Math.random() * 1000 })
        )
      ),
      -1 // repeat indefinitely
    );
  };
  
  // Load high score from AsyncStorage
  const loadHighScore = async () => {
    try {
      const storedHighScore = await AsyncStorage.getItem(HIGH_SCORE_KEY);
      if (storedHighScore !== null) {
        setHighScore(parseInt(storedHighScore));
      }
    } catch (error) {
      console.error('Error loading high score:', error);
    }
  };
  
  // Navigate to game
  const startGame = () => {
    navigation.navigate('Game');
  };
  
  // Navigate to instructions
  const showInstructions = () => {
    navigation.navigate('Instructions');
  };

  // Navigate to stats
  const showStats = () => {
    navigation.navigate('Stats');
  };
  
  // Animation styles
  const titleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: titleScale.value }],
    };
  });
  
  const playButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });
  
  const obstacleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: obstacleY.value }],
      left: Math.random() * SCREEN_WIDTH - 40,
    };
  });
  
  return (
    <ThemedView style={styles.container}>
      {/* Background elements */}
      <Animated.View style={[styles.fallingObstacle, obstacleStyle]} />
      
      {/* Title */}
      <Animated.View style={[styles.titleContainer, titleStyle]}>
        <ThemedText style={styles.title}>TAP & DODGE</ThemedText>
      </Animated.View>
      
      {/* High Score */}
      {highScore !== null && (
        <View style={styles.highScoreContainer}>
          <ThemedText style={styles.highScoreLabel}>HIGH SCORE</ThemedText>
          <ThemedText style={styles.highScoreValue}>{highScore}</ThemedText>
        </View>
      )}
      
      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <Animated.View style={playButtonStyle}>
          <TouchableOpacity 
            style={styles.playButton} 
            activeOpacity={0.8}
            onPress={startGame}
          >
            <ThemedText style={styles.playButtonText}>PLAY</ThemedText>
          </TouchableOpacity>
        </Animated.View>
        
        <TouchableOpacity 
          style={styles.instructionsButton} 
          activeOpacity={0.8}
          onPress={showInstructions}
        >
          <ThemedText style={styles.instructionsButtonText}>HOW TO PLAY</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.statsButton} 
          activeOpacity={0.8}
          onPress={showStats}
        >
          <ThemedText style={styles.statsButtonText}>STATISTICS</ThemedText>
        </TouchableOpacity>
      </View>
      
      {/* Attribution */}
      <ThemedText style={styles.attribution}>Version 1.0</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fallingObstacle: {
    position: 'absolute',
    width: 30,
    height: 30,
    backgroundColor: '#EF4444', // Red (Tailwind red-500)
    borderRadius: 4,
    opacity: 0.6,
  },
  titleContainer: {
    marginBottom: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#3B82F6', // Blue (Tailwind blue-500)
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  highScoreContainer: {
    marginBottom: 60,
    alignItems: 'center',
  },
  highScoreLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280', // Gray (Tailwind gray-500)
  },
  highScoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827', // Dark gray (Tailwind gray-900)
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  playButton: {
    backgroundColor: '#3B82F6', // Blue (Tailwind blue-500)
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  playButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
  },
  instructionsButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  instructionsButtonText: {
    color: '#6B7280', // Gray (Tailwind gray-500)
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  statsButtonText: {
    color: '#6B7280', // Gray (Tailwind gray-500)
    fontWeight: 'bold',
    fontSize: 16,
  },
  attribution: {
    position: 'absolute',
    bottom: 20,
    color: '#9CA3AF', // Gray (Tailwind gray-400)
    fontSize: 12,
  },
});