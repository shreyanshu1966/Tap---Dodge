import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';

const PLAYER_SIZE = 40;
const SCREEN_WIDTH = Dimensions.get('window').width;
const PLATFORM_HEIGHT = 20;

interface PlayerProps {
  position: Animated.SharedValue<number>;
  direction: Animated.SharedValue<number>; // -1 for left, 0 for idle, 1 for right
}

const Player: React.FC<PlayerProps> = ({ position, direction }) => {
  const positionStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: position.value },
        { rotate: `${direction.value * 10}deg` } // Rotate based on direction
      ],
    };
  });

  return (
    <Animated.View style={[styles.playerContainer, positionStyle]}>
      <View style={styles.player} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  playerContainer: {
    position: 'absolute',
    bottom: PLATFORM_HEIGHT, // Position above the platform
    left: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10, // Add this to ensure player is visible
  },
  player: {
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    backgroundColor: '#3B82F6', // Blue color similar to Tailwind's blue-500
    borderRadius: 4,
  },
});

export default Player;