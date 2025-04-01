import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingsButtonProps {
  muted: boolean;
  onToggleMute: () => void;
  position?: 'topLeft' | 'topRight';
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ 
  muted, 
  onToggleMute,
  position = 'topLeft'
}) => {
  return (
    <View style={[styles.container, position === 'topRight' ? styles.topRight : styles.topLeft]}>
      <TouchableOpacity
        style={styles.button}
        onPress={onToggleMute}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={muted ? 'volume-mute' : 'volume-high'} 
          size={24} 
          color="#4B5563" 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 50,
  },
  topLeft: {
    top: 10,
    left: 10,
  },
  topRight: {
    top: 10,
    right: 10,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    // Proper React Native shadow properties
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3, // Keep elevation for Android
  },
});

export default SettingsButton;