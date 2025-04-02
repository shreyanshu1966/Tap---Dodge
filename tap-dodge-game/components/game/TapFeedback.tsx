import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  withSequence,
} from 'react-native-reanimated';

interface TapFeedbackProps {
  position: { x: number; y: number };
  onComplete: () => void;
}

const TapFeedback: React.FC<TapFeedbackProps> = ({ position, onComplete }) => {
  const opacity = useSharedValue(0.7);
  const scale = useSharedValue(0.2);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });
  
  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0.7, { duration: 50 }),
      withTiming(0, { duration: 300 })
    );
    
    scale.value = withTiming(1, { duration: 350 }, () => {
      if (typeof onComplete === 'function') {
        onComplete();
      }
    });
  }, []);
  
  return (
    <Animated.View 
      style={[
        styles.ripple,
        animatedStyle,
        {
          left: position.x - 50,
          top: position.y - 50,
        },
      ]} 
    />
  );
};

const styles = StyleSheet.create({
  ripple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default TapFeedback;