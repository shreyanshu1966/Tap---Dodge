import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';

interface CountdownTimerProps {
  onComplete: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ onComplete }) => {
  const [count, setCount] = useState(3);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const onCompleteRef = useRef(onComplete);
  const hasCalledComplete = useRef(false);
  
  // Update ref when prop changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  useEffect(() => {
    console.log(`Countdown: current count = ${count}`);
    if (count === 0 && !hasCalledComplete.current) {
      console.log("Countdown complete, calling onComplete");
      hasCalledComplete.current = true;
      // Ensure onComplete is called only once
      if (typeof onCompleteRef.current === 'function') {
        // Add a small delay to ensure state updates have propagated
        setTimeout(() => {
          onCompleteRef.current();
        }, 100);
      }
    } else if (count > 0) {
      startAnimation();
    }
  }, [count]);
  
  const startAnimation = () => {
    scale.value = 0.5;
    opacity.value = 0;
    
    scale.value = withSequence(
      withTiming(1.2, { duration: 300 }),
      withTiming(1, { duration: 200 }),
      withTiming(1.5, { duration: 500 }),
      withTiming(0.8, { duration: 200 }, (finished) => {
        if (finished && count > 0) {
          runOnJS(setCount)(count - 1);
        }
      })
    );
    
    opacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(1, { duration: 700 }),
      withTiming(0, { duration: 200 })
    );
  };
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });
  
  if (count === 0) return null;
  
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.countdownContainer, animatedStyle]}>
        <ThemedText style={styles.countdownText}>{count}</ThemedText>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  countdownContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4B5563',
  },
});

export default CountdownTimer;