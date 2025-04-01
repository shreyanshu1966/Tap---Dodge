import React, { useState } from 'react';
import { View, StyleSheet, Switch, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DevSettingsProps {
  onClose: () => void;
  showPerformanceMonitor: boolean;
  onTogglePerformanceMonitor: () => void;
  onClearHighScore: () => void;
  isDevMode: boolean;
  onToggleDevMode: () => void;
  onRunMemoryCleanup: () => void;
  onTestCollision: () => void;
  gameStats: {
    obstacles: number;
    fps: number;
  };
}

const DevSettings: React.FC<DevSettingsProps> = ({
  onClose,
  showPerformanceMonitor,
  onTogglePerformanceMonitor,
  onClearHighScore,
  isDevMode,
  onToggleDevMode,
  onRunMemoryCleanup,
  onTestCollision,
  gameStats,
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Developer Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView}>
          <View style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>Performance</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Show FPS Monitor</Text>
              <Switch
                value={showPerformanceMonitor}
                onValueChange={onTogglePerformanceMonitor}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
              />
            </View>
          </View>
          
          <View style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>Game</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Developer Mode</Text>
              <Switch
                value={isDevMode}
                onValueChange={onToggleDevMode}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.dangerButton} 
              onPress={onClearHighScore}
            >
              <Text style={styles.dangerButtonText}>Clear High Score</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>Diagnostics</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Active Obstacles:</Text>
              <Text style={styles.infoValue}>{gameStats.obstacles}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current FPS:</Text>
              <Text style={styles.infoValue}>{gameStats.fps}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onRunMemoryCleanup}
            >
              <Text style={styles.actionButtonText}>Run Memory Cleanup</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onTestCollision}
            >
              <Text style={styles.actionButtonText}>Test Collision Effect</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Developer settings are reset when the app is restarted.
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // Tailwind gray-200
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827', // Tailwind gray-900
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: '100%',
  },
  settingsGroup: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // Tailwind gray-200
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B5563', // Tailwind gray-600
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1F2937', // Tailwind gray-800
  },
  dangerButton: {
    backgroundColor: '#EF4444', // Tailwind red-500
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  dangerButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  infoBox: {
    padding: 16,
    backgroundColor: '#F3F4F6', // Tailwind gray-100
  },
  infoText: {
    color: '#6B7280', // Tailwind gray-500
    fontSize: 14,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#4B5563', // Tailwind gray-600
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937', // Tailwind gray-800
  },
  actionButton: {
    backgroundColor: '#3B82F6', // Tailwind blue-500
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DevSettings;