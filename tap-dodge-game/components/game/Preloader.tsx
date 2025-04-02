import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface PreloaderProps {
  onComplete: () => void;
  assetStatus: {
    sounds: boolean;
  };
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete, assetStatus }) => {
  const [progress, setProgress] = useState(0);
  const opacity = useSharedValue(1);
  const hasStartedAnimation = useRef(false);
  const completeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate loading progress based on asset status
  useEffect(() => {
    let newProgress = 0;
    if (assetStatus.sounds) newProgress += 100;
    setProgress(newProgress);
    
    // Check if all assets are loaded and animation hasn't started yet
    if (newProgress >= 100 && !hasStartedAnimation.current) {
      hasStartedAnimation.current = true; // Mark animation as started
      
      // Wait a bit then fade out
      completeTimeoutRef.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 500 }, (finished) => {
          if (finished) {
            // Make sure onComplete is a function before calling it
            if (typeof onComplete === 'function') {
              runOnJS(onComplete)();
            }
          }
        });
      }, 500);
    }
    
    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
      }
    };
  }, [assetStatus.sounds]); // Remove opacity and onComplete from dependency array
  
  // Fallback: Force complete loading after a maximum time (5 seconds)
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!hasStartedAnimation.current) {
        console.log('Loading timed out, forcing completion');
        hasStartedAnimation.current = true;
        opacity.value = withTiming(0, { duration: 500 }, (finished) => {
          if (finished && typeof onComplete === 'function') {
            runOnJS(onComplete)();
          }
        });
      }
    }, 5000);

    return () => clearTimeout(fallbackTimer);
  }, []); // This empty dependency array is correct
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });
  
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content}>
        <Text style={styles.title}>Loading Game...</Text>
        <ActivityIndicator size="large" color="#3B82F6" style={styles.spinner} />
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F9FAFB', // Tailwind gray-50
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937', // Tailwind gray-800
    marginBottom: 20,
  },
  spinner: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 16,
    color: '#4B5563', // Tailwind gray-600
  },
});

export default Preloader;