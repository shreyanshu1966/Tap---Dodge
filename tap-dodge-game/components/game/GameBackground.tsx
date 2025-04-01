import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withRepeat,
  Easing
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameBackgroundProps {
  isPlaying: boolean;
}

const GameBackground: React.FC<GameBackgroundProps> = ({ isPlaying }) => {
  const backgroundPosition = useSharedValue(0);
  
  useEffect(() => {
    if (isPlaying) {
      // Create subtle background movement when playing
      backgroundPosition.value = withRepeat(
        withTiming(-200, { 
          duration: 20000, 
          easing: Easing.linear 
        }),
        -1, // Infinite repeat
        false // No reverse
      );
    } else {
      // Stop animation when game is not active
      backgroundPosition.value = withTiming(0, { duration: 500 });
    }
  }, [isPlaying]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: backgroundPosition.value }],
    };
  });
  
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.patternContainer, animatedStyle]}>
        {/* Generate a grid of dots for background */}
        {Array.from({ length: 30 }).map((_, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {Array.from({ length: 10 }).map((_, colIndex) => (
              <View 
                key={`dot-${rowIndex}-${colIndex}`} 
                style={styles.dot} 
              />
            ))}
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  patternContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 2, // Make it twice as tall to allow scrolling
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 40,
    width: '100%',
    justifyContent: 'space-around',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(107, 114, 128, 0.2)', // Subtle gray dots (Tailwind gray-500 with low opacity)
  },
});

export default GameBackground;