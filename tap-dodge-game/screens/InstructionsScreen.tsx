import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function InstructionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ThemedText style={styles.title}>How To Play</ThemedText>
        
        <View style={styles.instructionBlock}>
          <ThemedText style={styles.instructionTitle}>Game Objective</ThemedText>
          <ThemedText style={styles.instructionText}>
            Dodge falling obstacles for as long as possible to achieve the highest score!
          </ThemedText>
        </View>
        
        <View style={styles.instructionBlock}>
          <ThemedText style={styles.instructionTitle}>Controls</ThemedText>
          <ThemedText style={styles.instructionText}>
            • Tap the left side of screen to move left{'\n'}
            • Tap the right side of screen to move right
          </ThemedText>
        </View>
        
        <View style={styles.instructionBlock}>
          <ThemedText style={styles.instructionTitle}>Scoring</ThemedText>
          <ThemedText style={styles.instructionText}>
            • Your score increases automatically the longer you survive{'\n'}
            • The game gets progressively harder with faster and more frequent obstacles
          </ThemedText>
        </View>
        
        <View style={styles.instructionBlock}>
          <ThemedText style={styles.instructionTitle}>Tips</ThemedText>
          <ThemedText style={styles.instructionText}>
            • Plan your movements carefully - don't get trapped between obstacles{'\n'}
            • Stay near the center when possible for more movement options{'\n'}
            • Anticipate where obstacles will fall and position yourself accordingly
          </ThemedText>
        </View>
        
        <TouchableOpacity 
          style={styles.playButton} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Game')}
        >
          <ThemedText style={styles.playButtonText}>START PLAYING</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  instructionBlock: {
    marginBottom: 24,
    backgroundColor: 'rgba(243, 244, 246, 0.5)', // Light gray background (Tailwind gray-100 with opacity)
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6', // Blue (Tailwind blue-500)
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937', // Dark gray (Tailwind gray-800)
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563', // Gray (Tailwind gray-600)
  },
  playButton: {
    backgroundColor: '#3B82F6', // Blue (Tailwind blue-500)
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  playButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});