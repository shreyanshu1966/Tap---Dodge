import React from 'react';
import { View, StyleSheet } from 'react-native';
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
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: position.y.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.obstacle,
        animatedStyle,
        {
          left: position.x,
          width: size.width,
          height: size.height,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  obstacle: {
    position: 'absolute',
    backgroundColor: '#EF4444', // Red color similar to Tailwind's red-500
    borderRadius: 4,
  },
});

export default Obstacle;