import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';

interface LevelUpEffectProps {
  level: number;
  onComplete: () => void;
}

const LevelUpEffect: React.FC<LevelUpEffectProps> = ({ level, onComplete }) => {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    // Start animation sequence
    startAnimation();
  }, [level]);
  
  const startAnimation = () => {
    // Reset animation values
    scale.value = 0.5;
    opacity.value = 0;
    
    // Start scale and fade in/out animation
    scale.value = withSequence(
      withTiming(1.5, { duration: 300 }),
      withTiming(1.2, { duration: 200 }),
      withTiming(1.8, { duration: 300 }),
      withTiming(0.8, { duration: 200 }, () => {
        if (typeof onComplete === 'function') {
          runOnJS(onComplete)();
        }
      })
    );
    
    opacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(1, { duration: 500 }),
      withTiming(0, { duration: 200 })
    );
  };
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });
  
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.levelUpContainer, animatedStyle]}>
        <ThemedText style={styles.levelText}>LEVEL {level}</ThemedText>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    pointerEvents: 'none',
  },
  levelUpContainer: {
    backgroundColor: 'rgba(79, 70, 229, 0.8)', // Indigo (Tailwind indigo-600)
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  levelText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default LevelUpEffect;