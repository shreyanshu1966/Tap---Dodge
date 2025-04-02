import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';

// Define sound types for type safety
export type SoundType = 
  | 'tap' 
  | 'collision' 
  | 'gameOver' 
  | 'countdown' 
  | 'levelUp'
  | 'gameStart';

interface SoundManagerProps {
  muted: boolean;
}

export const useSoundManager = ({ muted = false }: SoundManagerProps) => {
  // Create refs to store loaded sounds
  const sounds = useRef<Record<SoundType, Audio.Sound | null>>({
    tap: null,
    collision: null,
    gameOver: null,
    countdown: null,
    levelUp: null,
    gameStart: null,
  });
  
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load sounds only once when the component mounts
  useEffect(() => {
    let isMounted = true;
    
    const loadSounds = async () => {
      try {
        // Configure audio mode
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        
        // Only set state if component is still mounted
        if (isMounted) {
          setLoaded(true);
        }
      } catch (error) {
        console.error('Error loading sounds:', error);
        if (isMounted) {
          setError('Failed to load sound assets');
        }
      }
    };
    
    loadSounds();
    
    return () => {
      isMounted = false;
      Object.values(sounds.current).forEach(sound => {
        if (sound) {
          sound.unloadAsync();
        }
      });
    };
  }, []); // Empty dependency array ensures this only runs once
  
  // Add a dummy function that doesn't try to play sounds
  const playSound = async (type: SoundType) => {
    if (muted) return;
    
    // Just log that we would play a sound
    console.log(`Would play sound: ${type}`);
    
    // In a real implementation, we'd play the sound if loaded
    const sound = sounds.current[type];
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } catch (error) {
        console.error(`Error playing ${type} sound:`, error);
      }
    }
  };
  
  return { playSound, loaded, error };
};