import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

interface ObstacleProps {
  position: {
    x: number;
    y: Animated.SharedValue<number>;
  };
  size: {
    width: number;
    height: number;
  };
}

const Obstacle: React.FC<ObstacleProps> = ({ position, size }) => {
  // Optimize animated style calculation
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: position.y.value }],
      left: position.x,
      width: size.width,
      height: size.height,
    };
  });

  return (
    <Animated.View style={[styles.obstacle, animatedStyle]} />
  );
};

const styles = StyleSheet.create({
  obstacle: {
    position: 'absolute',
    backgroundColor: '#EF4444', // Red color
    borderRadius: 4,
  },
});

// Use memo with custom comparison for better performance
export default memo(Obstacle, (prevProps, nextProps) => {
  // Only re-render if size or x position changed
  // The y position is handled by Reanimated
  return (
    prevProps.position.x === nextProps.position.x &&
    prevProps.size.width === nextProps.size.width &&
    prevProps.size.height === nextProps.size.height &&
    prevProps.position.y === nextProps.position.y
  );
});