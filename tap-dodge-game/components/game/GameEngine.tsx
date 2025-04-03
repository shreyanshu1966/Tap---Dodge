import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { View, StyleSheet, Dimensions, TouchableWithoutFeedback, Text, Platform } from 'react-native';
import Animated, { useSharedValue, withSpring, runOnJS, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import PhysicsGameEngine from './PhysicsEngine';
import ScoreDisplay from './ScoreDisplay';
import DirectionalIndicators from './DirectionalIndicators';
import GameBackground from './GameBackground';
import GameStats from './GameStats';
import CountdownTimer from './CountdownTimer';
import GameOverScreen from './GameOverScreen';
import { useSoundManager, SoundType } from './SoundManager';
import SettingsButton from './SettingsButton';
import LevelUpEffect from './LevelUpEffect';
import CollisionParticles from './CollisionParticles';
import PerformanceMonitor from './PerformanceMonitor';
import DevSettings from './DevSettings';
import Preloader from './Preloader';
import { Analytics } from '@/utils/Analytics';
import Player from './Player';
import TapFeedback from './TapFeedback';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PLAYER_SIZE = 40;
const PLATFORM_HEIGHT = 20;
const SCORE_INCREMENT_INTERVAL = 100; // ms
const DIFFICULTY_INCREASE_INTERVAL = 10000; // Increase difficulty every 10 seconds

// Update the GameEngineProps interface
interface GameEngineProps {
  onGameOver?: (score: number) => void;
  highScore?: number | null;
  onGameStateChange?: (state: 'idle' | 'countdown' | 'playing' | 'gameover') => void;
  deviceType?: 'phone' | 'tablet';
}

// Memoize child components that don't need frequent updates
const MemoizedPlayer = memo(Player);
const MemoizedGameBackground = memo(GameBackground);

const GameEngine: React.FC<GameEngineProps> = ({ 
  onGameOver, 
  highScore = null, 
  onGameStateChange,
  deviceType = 'phone' 
}) => {
  // Game state
  const [gameState, setGameState] = useState<'idle' | 'countdown' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [difficultyLevel, setDifficultyLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [muted, setMuted] = useState(false);
  const [devMenuVisible, setDevMenuVisible] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [fpsStats, setFpsStats] = useState(0);
  const [obstacleCount, setObstacleCount] = useState(0);
  
  // Visual effects
  const [tapFeedback, setTapFeedback] = useState<Array<{
    id: number;
    position: { x: number; y: number };
  }>>([]);
  const [collisionParticles, setCollisionParticles] = useState<Array<{
    id: number;
    position: { x: number; y: number };
  }>>([]);
  
  // Sound manager
  const { playSound, loaded: soundsLoaded } = useSoundManager({ muted });
  
  // Refs and shared values
  const nextTapId = useRef(0);
  const nextParticleId = useRef(0);
  const playerPosition = useSharedValue(SCREEN_WIDTH / 2 - PLAYER_SIZE / 2);
  const playerDirection = useSharedValue(0); // -1 for left, 0 for idle, 1 for right
  const previousLevel = useRef(1);
  const gameStateRef = useRef<'idle' | 'countdown' | 'playing' | 'gameover'>('idle');
  
  // Timers and intervals
  const scoreIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tutorialTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const difficultyIncreaseRef = useRef<NodeJS.Timeout | null>(null);
  const devTapCount = useRef(0);
  const devTapTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Physics engine ref for direct communication
  const physicsEngineRef = useRef<any>(null);
  
  // Toggle sound mute
  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    
    // Track settings change
    Analytics.trackEvent('settings_change', { 
      setting: 'sound',
      value: newMuted ? 'muted' : 'unmuted'
    });
  };
  
  // Initialize the game
  const initializeGame = () => {
    updateGameState('countdown');
    setScore(0);
    setDifficultyLevel(1);
    previousLevel.current = 1;
    
    // Play countdown sound
    playGameSound('countdown');
  };
  
  // Start the game after countdown
  const startGame = () => {
    console.log("Starting game!");
    
    // First update the game state
    updateGameState('playing');
    
    // Play game start sound
    playGameSound('gameStart');
    
    // Show tutorial for first 3 seconds of gameplay
    setShowTutorial(true);
    tutorialTimeoutRef.current = setTimeout(() => {
      setShowTutorial(false);
    }, 3000);
    
    // Start score counter
    scoreIntervalRef.current = setInterval(() => {
      setScore(prev => prev + 1);
    }, SCORE_INCREMENT_INTERVAL);
    
    // Start difficulty increase timer
    difficultyIncreaseRef.current = setInterval(() => {
      increaseDifficulty();
    }, DIFFICULTY_INCREASE_INTERVAL);
  };
  
  // Utility function to safely use haptics
  const triggerHaptic = (type: 'impact' | 'notification', options?: any) => {
    // Only use haptics on native platforms (iOS/Android)
    if (Platform.OS !== 'web') {
      try {
        if (type === 'impact') {
          Haptics.impactAsync(options || Haptics.ImpactFeedbackStyle.Light);
        } else if (type === 'notification') {
          Haptics.notificationAsync(options || Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
  };

  // Watch for level changes to show level up effect
  useEffect(() => {
    if (gameState === 'playing' && difficultyLevel > previousLevel.current) {
      previousLevel.current = difficultyLevel;
      setShowLevelUp(true);
      playGameSound('levelUp');
      
      triggerHaptic('notification', Haptics.NotificationFeedbackType.Success);
    }
  }, [difficultyLevel, gameState]);
  
  // Increase game difficulty
  const increaseDifficulty = () => {
    const newLevel = difficultyLevel + 1;
    setDifficultyLevel(newLevel);
    
    // Track level up event
    Analytics.trackEvent('level_up', { level: newLevel });
  };
  
  // Handle game over
  const handleGameOver = (collisionPosition?: { x: number, y: number }) => {
    if (gameState === 'gameover') return;
    
    // Create collision particles at provided position or default to player position
    const position = collisionPosition || {
      x: playerPosition.value + PLAYER_SIZE / 2,
      y: SCREEN_HEIGHT - PLATFORM_HEIGHT - PLAYER_SIZE
    };
    
    setCollisionParticles(prev => [
      ...prev,
      {
        id: nextParticleId.current++,
        position,
      },
    ]);
    
    // Play game over sound
    playGameSound('gameOver');
    
    triggerHaptic('notification', Haptics.NotificationFeedbackType.Error);
    
    updateGameState('gameover');
    
    // Stop all intervals and timeouts
    if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
    if (tutorialTimeoutRef.current) clearTimeout(tutorialTimeoutRef.current);
    if (difficultyIncreaseRef.current) clearInterval(difficultyIncreaseRef.current);
    
    // Notify parent component
    if (onGameOver) onGameOver(score);
  };
  
  // Handle screen tap
  const handleTap = (event: any) => {
    // Dev menu gesture
    if (event.nativeEvent.locationY < 50 && event.nativeEvent.locationX < 50) {
      handleDevMenuGesture();
    }
    
    const tapPosition = {
      x: event.nativeEvent.locationX,
      y: event.nativeEvent.locationY,
    };
    
    // Add visual feedback
    setTapFeedback(prev => [
      ...prev, 
      { id: nextTapId.current++, position: tapPosition }
    ]);
    
    // Start game if idle
    if (gameState === 'idle') {
      initializeGame();
      return;
    }
    
    // Ignore taps during countdown or game over
    if (gameState !== 'playing') return;
    
    // Play tap sound
    playGameSound('tap');
    
    triggerHaptic('impact', Haptics.ImpactFeedbackStyle.Light);
    
    // Let the physics engine handle the movement
    // The tap position is passed directly to PhysicsEngine component
    // which will determine direction and handle movement
    if (physicsEngineRef.current) {
      physicsEngineRef.current.handlePlayerMovement(tapPosition.x);
    }
  };
  
  // Handle restart from game over
  const handleRestart = () => {
    initializeGame();
  };
  
  // Handle level up effect completion
  const handleLevelUpComplete = () => {
    setShowLevelUp(false);
  };
  
  // Clean up on unmount
  useEffect(() => {
    return cleanup;
  }, []);
  
  const removeTapFeedback = (id: number) => {
    setTapFeedback(prev => prev.filter(tap => tap.id !== id));
  };
  
  const removeCollisionParticles = (id: number) => {
    setCollisionParticles(prev => prev.filter(particle => particle.id !== id));
  };
  
  // Update state setter to notify parent of state changes
  const updateGameState = (newState: 'idle' | 'countdown' | 'playing' | 'gameover') => {
    gameStateRef.current = newState; // Update ref immediately
    setGameState(newState);
    if (onGameStateChange) {
      onGameStateChange(newState);
    }
  };

  const clearHighScore = async () => {
    if (onGameOver) onGameOver(0); // This will trigger the parent to save a high score of 0
    setDevMenuVisible(false);
  };

  const handleDevMenuGesture = () => {
    if (gameState === 'playing') return; // Only allow when not playing
    
    devTapCount.current += 1;
    
    if (devTapTimer.current) {
      clearTimeout(devTapTimer.current);
    }
    
    if (devTapCount.current >= 5) {
      // Show dev menu after 5 rapid taps
      setDevMenuVisible(true);
      devTapCount.current = 0;
      return;
    }
    
    // Reset tap count after 500ms
    devTapTimer.current = setTimeout(() => {
      devTapCount.current = 0;
    }, 500);
  };

  useEffect(() => {
    if (soundsLoaded) {
      setAssetsLoaded(true);
    }
  }, [soundsLoaded]);

  const runMemoryCleanup = () => {
    // Reset visual elements
    setTapFeedback([]);
    setCollisionParticles([]);
    
    // Request physics engine cleanup
    if (physicsEngineRef.current) {
      physicsEngineRef.current.cleanupEntities();
    }
    
    // Log success
    console.log('Memory cleanup performed');
  };

  const testCollisionEffect = () => {
    const position = {
      x: playerPosition.value + PLAYER_SIZE / 2,
      y: SCREEN_HEIGHT - PLATFORM_HEIGHT - PLAYER_SIZE
    };
    
    setCollisionParticles(prev => [
      ...prev,
      {
        id: nextParticleId.current++,
        position,
      },
    ]);
    
    // Play sound without triggering game over
    playGameSound('collision');
    
    triggerHaptic('impact', Haptics.ImpactFeedbackStyle.Heavy);
  };

  const playGameSound = (soundName: SoundType) => {
    try {
      playSound(soundName);
    } catch (error) {
      // Silently handle sound errors to prevent game crashes
      console.log(`Could not play ${soundName} sound`);
    }
  };

  // Cleanup function
  const cleanup = () => {
    // Clear all intervals and timeouts
    if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
    if (tutorialTimeoutRef.current) clearTimeout(tutorialTimeoutRef.current);
    if (difficultyIncreaseRef.current) clearInterval(difficultyIncreaseRef.current);
    if (devTapTimer.current) clearTimeout(devTapTimer.current);
  };

  // Handle physics engine updates
  const handlePhysicsUpdate = (data: { 
    playerPosition?: number;
    obstacleCount?: number;
    collision?: { x: number, y: number };
  }) => {
    // Update player position if provided
    if (data.playerPosition !== undefined) {
      playerPosition.value = data.playerPosition;
    }
    
    // Update obstacle count if provided
    if (data.obstacleCount !== undefined) {
      setObstacleCount(data.obstacleCount);
    }
    
    // Handle collision if detected
    if (data.collision) {
      handleGameOver(data.collision);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        <MemoizedGameBackground isPlaying={gameState === 'playing'} />
        
        {/* Player visualization */}
        <MemoizedPlayer
          position={playerPosition}
          direction={playerDirection}
        />
        
        {!loadingComplete && (
          <Preloader 
            onComplete={() => setLoadingComplete(true)}
            assetStatus={{
              sounds: soundsLoaded,
            }}
          />
        )}
        
        {/* Settings Button */}
        <SettingsButton muted={muted} onToggleMute={toggleMute} />
        
        {/* Score Display */}
        <ScoreDisplay score={score} gameOver={false} />
        
        {/* Game Stats Display */}
        {gameState === 'playing' && (
          <GameStats 
            difficulty={difficultyLevel} 
            obstacleSpeed={3 + (difficultyLevel * 0.3)}  // Calculate based on difficulty
            obstacleCount={obstacleCount}
          />
        )}
        
        {/* Physics Game Engine - handles all the physics simulation */}
        <PhysicsGameEngine 
          ref={physicsEngineRef}
          isPlaying={gameState === 'playing'}
          difficultyLevel={difficultyLevel}
          onUpdate={handlePhysicsUpdate}
          deviceType={deviceType}
          isDevMode={isDevMode}
          playerDirection={playerDirection}
        />
        
        {/* Directional Indicators */}
        <DirectionalIndicators visible={showTutorial && gameState === 'playing'} />
        
        {/* Tap Feedback */}
        {tapFeedback.map(tap => (
          <TapFeedback 
            key={tap.id} 
            position={tap.position} 
            onComplete={() => removeTapFeedback(tap.id)}
          />
        ))}
        
        {/* Collision Particles */}
        {collisionParticles.map(particle => (
          <CollisionParticles
            key={particle.id}
            position={particle.position}
            onComplete={() => removeCollisionParticles(particle.id)}
          />
        ))}
        
        {/* Level Up Effect */}
        {showLevelUp && (
          <LevelUpEffect 
            level={difficultyLevel} 
            onComplete={handleLevelUpComplete} 
          />
        )}
        
        {/* Countdown Timer */}
        {gameState === 'countdown' && (
          <CountdownTimer onComplete={startGame} />
        )}
        
        {/* Game Start Screen */}
        {gameState === 'idle' && (
          <View style={styles.overlay}>
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>Tap to Start</Text>
            </View>
          </View>
        )}
        
        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <GameOverScreen 
            score={score}
            highScore={highScore}
            onRestart={handleRestart}
          />
        )}
        
        {devMenuVisible && (
          <DevSettings
            onClose={() => setDevMenuVisible(false)}
            showPerformanceMonitor={showPerformanceMonitor}
            onTogglePerformanceMonitor={() => setShowPerformanceMonitor(prev => !prev)}
            onClearHighScore={clearHighScore}
            isDevMode={isDevMode}
            onToggleDevMode={() => setIsDevMode(prev => !prev)}
            onRunMemoryCleanup={runMemoryCleanup}
            onTestCollision={testCollisionEffect}
            gameStats={{
              obstacles: obstacleCount,
              fps: fpsStats,
            }}
          />
        )}

        <PerformanceMonitor 
          visible={showPerformanceMonitor} 
          onFpsUpdate={(fps) => setFpsStats(fps)}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Tailwind gray-50 equivalent
  },
  platform: {
    position: 'absolute',
    bottom: 0,
    width: SCREEN_WIDTH,
    height: PLATFORM_HEIGHT,
    backgroundColor: '#4B5563', // Tailwind gray-600 equivalent
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  messageBox: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937', // Tailwind gray-800 equivalent
  },
});

export default GameEngine;