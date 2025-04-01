import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

import GameEngine from '@/components/game/GameEngine';
import { ThemedText } from '@/components/ThemedText';
import { Analytics } from '@/utils/Analytics';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const HIGH_SCORE_KEY = '@tap_dodge_high_score';

const getDeviceType = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = height / width;
  
  if (Platform.OS === 'ios') {
    // Check if device is iPad
    return Platform.isPad ? 'tablet' : 'phone';
  } else if (Platform.OS === 'android') {
    // Use aspect ratio to determine phone vs tablet on Android
    return aspectRatio > 1.6 ? 'phone' : 'tablet';
  }
  
  // Default to phone for web or other platforms
  return 'phone';
};

export default function GameScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [highScore, setHighScore] = useState<number | null>(null);
  const [isGameActive, setIsGameActive] = useState(false);

  const deviceType = getDeviceType();

  // Load high score when component mounts
  React.useEffect(() => {
    loadHighScore();
    // Track app launch
    Analytics.trackEvent('app_launch');
  }, []);

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

  // Save high score to AsyncStorage
  const saveHighScore = async (score: number) => {
    try {
      if (highScore === null || score > highScore) {
        await AsyncStorage.setItem(HIGH_SCORE_KEY, score.toString());
        setHighScore(score);
      }
    } catch (error) {
      console.error('Error saving high score:', error);
    }
  };

  // Add this function to ensure high score is properly saved
  const ensureHighScoreSaved = async (score: number) => {
    try {
      // First try to get existing high score
      const storedHighScore = await AsyncStorage.getItem(HIGH_SCORE_KEY);
      const currentHighScore = storedHighScore ? parseInt(storedHighScore) : 0;
      
      // Only save if new score is higher
      if (score > currentHighScore) {
        await AsyncStorage.setItem(HIGH_SCORE_KEY, score.toString());
        setHighScore(score);
        
        // Track high score achievement
        Analytics.trackEvent('game_over', { 
          score,
          newHighScore: true
        });
        
        return true; // Indicates a new high score was set
      } else {
        // Track regular game over
        Analytics.trackEvent('game_over', { 
          score,
          newHighScore: false
        });
        
        return false; // No new high score
      }
    } catch (error) {
      console.error('Error saving high score:', error);
      return false;
    }
  };

  // Handle game over event
  const handleGameOver = async (score: number) => {
    const isNewHighScore = await ensureHighScoreSaved(score);
    setIsGameActive(false);
  };
  
  // Handle game state change
  const handleGameStateChange = (state: 'idle' | 'countdown' | 'playing' | 'gameover') => {
    setIsGameActive(state === 'playing' || state === 'countdown');
    
    // Track when game starts playing
    if (state === 'playing') {
      Analytics.trackEvent('game_start');
    }
  };
  
  // Navigate back to home screen
  const goBack = () => {
    if (!isGameActive) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {!isGameActive && (
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
        )}
        <ThemedText style={styles.title}>Tap & Dodge</ThemedText>
        <ThemedText style={styles.highScore}>
          {highScore !== null ? `High: ${highScore}` : ''}
        </ThemedText>
      </View>
      
      <StatusBar hidden />
      <ErrorBoundary>
        <GameEngine 
          onGameOver={handleGameOver} 
          highScore={highScore}
          onGameStateChange={handleGameStateChange}
          deviceType={deviceType}
        />
      </ErrorBoundary>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Tailwind gray-50 equivalent
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  highScore: {
    marginRight: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
});