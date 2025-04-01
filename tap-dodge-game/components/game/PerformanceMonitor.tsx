import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PerformanceMonitorProps {
  visible: boolean;
  onFpsUpdate?: (fps: number) => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  visible,
  onFpsUpdate 
}) => {
  const [fps, setFps] = useState(0);
  const [render, setRender] = useState(0);
  const lastUpdateTime = useRef(Date.now());
  const frameCount = useRef(0);
  
  useEffect(() => {
    if (!visible) return;
    
    const intervalId = setInterval(() => {
      const now = Date.now();
      const delta = now - lastUpdateTime.current;
      const currentFps = Math.round((frameCount.current * 1000) / delta);
      
      setFps(currentFps);
      // Call the callback with the current FPS
      if (onFpsUpdate) onFpsUpdate(currentFps);
      
      lastUpdateTime.current = now;
      frameCount.current = 0;
      
      // Force render to count how many renders happen in a second
      setRender(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [visible, onFpsUpdate]);
  
  // Count frames
  useEffect(() => {
    if (!visible) return;
    frameCount.current += 1;
  });
  
  if (!visible) return null;
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>FPS: {fps}</Text>
      <Text style={styles.text}>Renders: {render}/s</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 5,
    zIndex: 100,
  },
  text: {
    color: 'white',
    fontSize: 12,
  },
});

export default PerformanceMonitor;