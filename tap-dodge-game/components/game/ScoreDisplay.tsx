import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ScoreDisplayProps {
  score: number;
  gameOver?: boolean;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, gameOver = false }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.scoreText, gameOver && styles.gameOverScoreText]}>
        {gameOver ? 'Final Score: ' : 'Score: '}{score}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 10,
    zIndex: 10,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937', // Tailwind gray-800 equivalent
  },
  gameOverScoreText: {
    fontSize: 36,
    color: '#EF4444', // Tailwind red-500 equivalent
  },
});

export default ScoreDisplay;