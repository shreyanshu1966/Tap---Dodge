import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Analytics } from '@/utils/Analytics';

interface GameStats {
  totalGamesPlayed: number;
  totalGamesCompleted: number;
  averageScore: number;
  highestScore: number;
  completionRate: number;
}

export default function StatsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = async () => {
    setLoading(true);
    try {
      const gameStats = await Analytics.getStats();
      setStats(gameStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const resetStats = async () => {
    setLoading(true);
    try {
      await Analytics.clearEvents();
      await loadStats();
    } catch (error) {
      console.error('Error resetting stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Your Game Stats</ThemedText>
      
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      ) : stats ? (
        <View style={styles.statsContainer}>
          <View style={styles.statBlock}>
            <ThemedText style={styles.statLabel}>Games Played</ThemedText>
            <ThemedText style={styles.statValue}>{stats.totalGamesPlayed}</ThemedText>
          </View>
          
          <View style={styles.statBlock}>
            <ThemedText style={styles.statLabel}>Games Completed</ThemedText>
            <ThemedText style={styles.statValue}>{stats.totalGamesCompleted}</ThemedText>
          </View>
          
          <View style={styles.statBlock}>
            <ThemedText style={styles.statLabel}>Average Score</ThemedText>
            <ThemedText style={styles.statValue}>{stats.averageScore}</ThemedText>
          </View>
          
          <View style={styles.statBlock}>
            <ThemedText style={styles.statLabel}>Highest Score</ThemedText>
            <ThemedText style={styles.statHighlight}>{stats.highestScore}</ThemedText>
          </View>
          
          <View style={styles.statBlock}>
            <ThemedText style={styles.statLabel}>Completion Rate</ThemedText>
            <ThemedText style={styles.statValue}>{stats.completionRate.toFixed(1)}%</ThemedText>
          </View>
        </View>
      ) : (
        <ThemedText style={styles.noStats}>No game statistics available yet. Play some games to see your stats!</ThemedText>
      )}
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Game')}
      >
        <ThemedText style={styles.buttonText}>PLAY GAME</ThemedText>
      </TouchableOpacity>
      
      {stats && stats.totalGamesPlayed > 0 && (
        <TouchableOpacity 
          style={styles.resetButton} 
          onPress={resetStats}
        >
          <ThemedText style={styles.resetButtonText}>Reset Statistics</ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  loader: {
    marginVertical: 30,
  },
  statsContainer: {
    backgroundColor: 'rgba(243, 244, 246, 0.5)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  statBlock: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(209, 213, 219, 0.5)',
    paddingBottom: 12,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statHighlight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  noStats: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    marginVertical: 30,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  resetButtonText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
});