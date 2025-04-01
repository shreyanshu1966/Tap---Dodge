import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';

interface GameOverScreenProps {
  score: number;
  highScore: number | null;
  onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  score, 
  highScore, 
  onRestart 
}) => {
  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.8);
  const contentOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);
  const buttonOpacity = useSharedValue(0);
  
  const isHighScore = highScore !== null && score >= highScore;
  
  useEffect(() => {
    // Animate the overlay
    overlayOpacity.value = withTiming(1, { duration: 400 });
    
    // Animate the content
    contentScale.value = withDelay(
      200,
      withSequence(
        withTiming(1.1, { duration: 300 }),
        withTiming(1, { duration: 200 })
      )
    );
    
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    
    // Animate the button
    buttonScale.value = withDelay(
      600,
      withSequence(
        withTiming(1.1, { duration: 300 }),
        withTiming(1, { duration: 200 })
      )
    );
    
    buttonOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));
  }, []);
  
  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
    };
  });
  
  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [{ scale: contentScale.value }],
    };
  });
  
  const buttonStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [{ scale: buttonScale.value }],
    };
  });
  
  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <Animated.View style={[styles.content, contentStyle]}>
        <ThemedText style={styles.gameOverText}>GAME OVER</ThemedText>
        
        <View style={styles.scoreContainer}>
          <ThemedText style={styles.scoreLabel}>SCORE</ThemedText>
          <ThemedText style={styles.scoreValue}>{score}</ThemedText>
          
          {isHighScore && (
            <View style={styles.newHighScoreBadge}>
              <ThemedText style={styles.newHighScoreText}>NEW HIGH SCORE!</ThemedText>
            </View>
          )}
        </View>
        
        {highScore !== null && (
          <View style={styles.highScoreContainer}>
            <ThemedText style={styles.highScoreLabel}>HIGH SCORE</ThemedText>
            <ThemedText style={styles.highScoreValue}>{highScore}</ThemedText>
          </View>
        )}
        
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <TouchableOpacity 
            style={styles.button} 
            activeOpacity={0.8}
            onPress={onRestart}
          >
            <ThemedText style={styles.buttonText}>PLAY AGAIN</ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#EF4444', // Tailwind red-500
    marginBottom: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B5563', // Tailwind gray-600
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827', // Tailwind gray-900
  },
  highScoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  highScoreLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280', // Tailwind gray-500
  },
  highScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B5563', // Tailwind gray-600
  },
  newHighScoreBadge: {
    position: 'absolute',
    top: -10,
    right: -40,
    backgroundColor: '#FBBF24', // Tailwind yellow-400
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    transform: [{ rotate: '15deg' }],
  },
  newHighScoreText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#7C2D12', // Tailwind orange-900
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#3B82F6', // Tailwind blue-500
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default GameOverScreen;