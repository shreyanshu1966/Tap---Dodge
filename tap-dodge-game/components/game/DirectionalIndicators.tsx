import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DirectionalIndicatorsProps {
  visible: boolean;
}

const DirectionalIndicators: React.FC<DirectionalIndicatorsProps> = ({ visible }) => {
  if (!visible) return null;
  
  return (
    <>
      <View style={styles.leftIndicator}>
        <ThemedText style={styles.indicatorText}>← Tap to move left</ThemedText>
      </View>
      <View style={styles.rightIndicator}>
        <ThemedText style={styles.indicatorText}>Tap to move right →</ThemedText>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  leftIndicator: {
    position: 'absolute',
    top: '40%',
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 8,
  },
  rightIndicator: {
    position: 'absolute',
    top: '40%',
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 8,
  },
  indicatorText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DirectionalIndicators;