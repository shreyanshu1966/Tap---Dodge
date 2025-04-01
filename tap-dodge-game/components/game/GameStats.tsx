import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface GameStatsProps {
  difficulty: number;
  obstacleSpeed: number;
}

const GameStats: React.FC<GameStatsProps> = ({ difficulty, obstacleSpeed }) => {
  // Convert difficulty to a more user-friendly scale (1-10)
  const displayDifficulty = Math.min(10, Math.max(1, Math.floor(difficulty)));
  
  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <ThemedText style={styles.statLabel}>LEVEL</ThemedText>
        <ThemedText style={styles.statValue}>{displayDifficulty}</ThemedText>
      </View>
      
      <View style={styles.statItem}>
        <ThemedText style={styles.statLabel}>SPEED</ThemedText>
        <ThemedText style={styles.statValue}>{obstacleSpeed.toFixed(1)}</ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9CA3AF', // Tailwind gray-400
    textAlign: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F3F4F6', // Tailwind gray-100
    textAlign: 'center',
  },
});

export default GameStats;