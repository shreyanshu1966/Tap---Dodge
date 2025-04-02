import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ParticleProps {
  color: string;
  posX: number;
  posY: number;
  delay: number;
  size: number;
}

// Individual particle component
const Particle: React.FC<ParticleProps> = ({ color, posX, posY, delay, size }) => {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  // Generate random direction
  const angle = Math.random() * Math.PI * 2;
  const distance = 20 + Math.random() * 80;
  const destX = Math.cos(angle) * distance;
  const destY = Math.sin(angle) * distance;
  
  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withTiming(destX, { duration: 500 + Math.random() * 500 })
    );
    
    translateY.value = withDelay(
      delay,
      withTiming(destY, { duration: 500 + Math.random() * 500 })
    );
    
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.2, { duration: 100 }),
        withTiming(0.2, { duration: 500 + Math.random() * 300 })
      )
    );
    
    opacity.value = withDelay(
      delay,
      withTiming(0, { duration: 700 + Math.random() * 300 })
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });
  
  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          width: size,
          height: size,
          left: posX,
          top: posY,
        },
        animatedStyle,
      ]}
    />
  );
};

interface CollisionParticlesProps {
  position: { x: number; y: number };
  colors?: string[];
  count?: number;
  onComplete: () => void;
}

const CollisionParticles: React.FC<CollisionParticlesProps> = ({
  position,
  colors = ['#EF4444', '#3B82F6', '#F59E0B', '#10B981'],
  count = 20,
  onComplete,
}) => {
  const [particles, setParticles] = useState<React.ReactNode[]>([]);
  
  useEffect(() => {
    const particleElements = [];
    
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 4 + Math.random() * 6;
      const delay = Math.random() * 100;
      
      particleElements.push(
        <Particle
          key={i}
          color={color}
          posX={position.x}
          posY={position.y}
          delay={delay}
          size={size}
        />
      );
    }
    
    setParticles(particleElements);
    
    // Clean up after animation completes
    const timeout = setTimeout(() => {
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  return <View style={styles.container}>{particles}</View>;
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
  },
});

export default CollisionParticles;