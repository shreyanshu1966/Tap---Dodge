import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

// Define obstacle types
export type ObstacleType = 'standard' | 'bouncing' | 'splitting' | 'spinning';

interface ObstacleProps {
  position: {
    x: number;
    y: Animated.SharedValue<number>;
  };
  size: {
    width: number;
    height: number;
  };
  type?: ObstacleType;
  rotation?: Animated.SharedValue<number>; // For spinning obstacles
}

const Obstacle: React.FC<ObstacleProps> = ({ position, size, type = 'standard', rotation }) => {
  // Optimize animated style calculation
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: position.y.value },
        ...(rotation ? [{ rotate: `${rotation.value}deg` }] : []),
      ],
      left: position.x,
      width: size.width,
      height: size.height,
    };
  });

  // Different styles based on obstacle type
  const getObstacleStyle = () => {
    switch (type) {
      case 'bouncing':
        return styles.bouncingObstacle;
      case 'splitting':
        return styles.splittingObstacle;
      case 'spinning':
        return styles.spinningObstacle;
      default:
        return styles.standardObstacle;
    }
  };

  return (
    <Animated.View style={[styles.obstacle, getObstacleStyle(), animatedStyle]}>
      {type === 'splitting' && (
        <View style={styles.splittingLine} />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  obstacle: {
    position: 'absolute',
    borderRadius: 4,
  },
  standardObstacle: {
    backgroundColor: '#EF4444', // Red color
  },
  bouncingObstacle: {
    backgroundColor: '#F59E0B', // Amber color
    borderRadius: 25, // More rounded for bouncing obstacles
  },
  splittingObstacle: {
    backgroundColor: '#8B5CF6', // Purple color
    position: 'relative',
  },
  spinningObstacle: {
    backgroundColor: '#10B981', // Green color
    borderRadius: 4,
  },
  splittingLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});

// Use memo with custom comparison for better performance
export default memo(Obstacle, (prevProps, nextProps) => {
  // Only re-render if size, x position, or type changed
  // The y position is handled by Reanimated
  return (
    prevProps.position.x === nextProps.position.x &&
    prevProps.size.width === nextProps.size.width &&
    prevProps.size.height === nextProps.size.height &&
    prevProps.type === nextProps.type
  );
});