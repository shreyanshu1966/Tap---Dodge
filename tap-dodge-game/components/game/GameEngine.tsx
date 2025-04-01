import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { View, StyleSheet, Dimensions, TouchableWithoutFeedback, Text } from 'react-native';
import { useSharedValue, withSpring, runOnJS, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import Player from './Player';
import Obstacle from './Obstacle';
import ScoreDisplay from './ScoreDisplay';
import DirectionalIndicators from './DirectionalIndicators';
import TapFeedback from './TapFeedback';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PLAYER_SIZE = 40;
const PLATFORM_HEIGHT = 20;
const OBSTACLE_MIN_WIDTH = 30;
const OBSTACLE_MAX_WIDTH = 80;
const OBSTACLE_MIN_HEIGHT = 20;
const OBSTACLE_MAX_HEIGHT = 40;
const OBSTACLE_SPEED_INITIAL = 3;
const OBSTACLE_SPEED_INCREMENT = 0.2;
const OBSTACLE_GENERATION_INTERVAL_INITIAL = 2000; // ms
const OBSTACLE_GENERATION_INTERVAL_MIN = 800; // ms
const SCORE_INCREMENT_INTERVAL = 100; // ms
const PLAYER_MOVE_DISTANCE = 70; // Increased from 50 for more pronounced movement
const DIFFICULTY_INCREASE_INTERVAL = 10000; // Increase difficulty every 10 seconds

// Update the GameEngineProps interface
interface GameEngineProps {
  onGameOver?: (score: number) => void;
  highScore?: number | null;
  onGameStateChange?: (state: 'idle' | 'countdown' | 'playing' | 'gameover') => void;
  deviceType?: 'phone' | 'tablet'; // Add this line
}

// Memoize child components that don't need frequent updates
const MemoizedPlayer = memo(Player);
const MemoizedObstacle = memo(Obstacle);
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
  
  // Game objects
  const [obstacles, setObstacles] = useState<Array<{
    id: number;
    position: { x: number; y: any };
    size: { width: number; height: number };
  }>>([]);
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
  const obstacleSpeed = useRef(OBSTACLE_SPEED_INITIAL);
  const obstacleGenerationInterval = useRef(OBSTACLE_GENERATION_INTERVAL_INITIAL);
  const nextObstacleId = useRef(0);
  const previousLevel = useRef(1);
  
  // Timers and intervals
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const obstacleGeneratorRef = useRef<NodeJS.Timeout | null>(null);
  const scoreIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tutorialTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const difficultyIncreaseRef = useRef<NodeJS.Timeout | null>(null);
  const devTapCount = useRef(0);
  const devTapTimer = useRef<NodeJS.Timeout | null>(null);
  
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
    setObstacles([]);
    setDifficultyLevel(1);
    previousLevel.current = 1;
    
    playerPosition.value = SCREEN_WIDTH / 2 - PLAYER_SIZE / 2;
    playerDirection.value = 0;
    obstacleSpeed.current = OBSTACLE_SPEED_INITIAL;
    obstacleGenerationInterval.current = OBSTACLE_GENERATION_INTERVAL_INITIAL;
    nextObstacleId.current = 0;
    
    // Play countdown sound
    playGameSound('countdown');
  };
  
  // Start the game after countdown
  const startGame = () => {
    updateGameState('playing');
    
    // Play game start sound
    playGameSound('gameStart');
    
    // Show tutorial for first 3 seconds of gameplay
    setShowTutorial(true);
    tutorialTimeoutRef.current = setTimeout(() => {
      setShowTutorial(false);
    }, 3000);
    
    // Start game loop
    startGameLoop();
    
    // Start obstacle generator
    obstacleGeneratorRef.current = setInterval(
      generateObstacle,
      obstacleGenerationInterval.current
    );
    
    // Start score counter
    scoreIntervalRef.current = setInterval(() => {
      setScore(prev => prev + 1);
    }, SCORE_INCREMENT_INTERVAL);
    
    // Start difficulty increase timer
    difficultyIncreaseRef.current = setInterval(() => {
      increaseDifficulty();
    }, DIFFICULTY_INCREASE_INTERVAL);
  };
  
  // Watch for level changes to show level up effect
  useEffect(() => {
    if (gameState === 'playing' && difficultyLevel > previousLevel.current) {
      previousLevel.current = difficultyLevel;
      setShowLevelUp(true);
      playGameSound('levelUp');
      
      // Add haptic feedback for level up
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [difficultyLevel, gameState]);
  
  // Increase game difficulty
  const increaseDifficulty = () => {
    const newLevel = difficultyLevel + 1;
    setDifficultyLevel(newLevel);
    
    // Track level up event
    Analytics.trackEvent('level_up', { level: newLevel });
    
    // Increase obstacle speed
    obstacleSpeed.current += OBSTACLE_SPEED_INCREMENT;
    
    // Decrease obstacle generation interval
    if (obstacleGenerationInterval.current > OBSTACLE_GENERATION_INTERVAL_MIN) {
      obstacleGenerationInterval.current -= Math.min(
        200,
        obstacleGenerationInterval.current - OBSTACLE_GENERATION_INTERVAL_MIN
      );
      
      // Reset the interval with new timing
      if (obstacleGeneratorRef.current) {
        clearInterval(obstacleGeneratorRef.current);
        obstacleGeneratorRef.current = setInterval(
          generateObstacle,
          obstacleGenerationInterval.current
        );
      }
    }
  };
  
  // Handle game over
  const handleGameOver = () => {
    if (gameState === 'gameover') return;
    
    // Create collision particles at player position
    const playerCenterX = playerPosition.value + PLAYER_SIZE / 2;
    const playerTop = SCREEN_HEIGHT - PLATFORM_HEIGHT - PLAYER_SIZE;
    
    setCollisionParticles(prev => [
      ...prev,
      {
        id: nextParticleId.current++,
        position: { x: playerCenterX, y: playerTop },
      },
    ]);
    
    // Play game over sound
    playGameSound('gameOver');
    
    // Add intense haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    updateGameState('gameover');
    
    // Stop all intervals and timeouts
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (obstacleGeneratorRef.current) clearInterval(obstacleGeneratorRef.current);
    if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
    if (tutorialTimeoutRef.current) clearTimeout(tutorialTimeoutRef.current);
    if (difficultyIncreaseRef.current) clearInterval(difficultyIncreaseRef.current);
    
    // Notify parent component
    if (onGameOver) onGameOver(score);
  };
  
  // Generate a new obstacle
  const generateObstacle = () => {
    if (gameState !== 'playing') return;
    
    const width = Math.random() * (OBSTACLE_MAX_WIDTH - OBSTACLE_MIN_WIDTH) + OBSTACLE_MIN_WIDTH;
    const height = Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT) + OBSTACLE_MIN_HEIGHT;
    const x = Math.random() * (SCREEN_WIDTH - width);
    
    const newObstacle = {
      id: nextObstacleId.current++,
      position: {
        x,
        y: useSharedValue(-height),
      },
      size: { width, height },
    };
    
    setObstacles(prev => [...prev, newObstacle]);
  };
  
  // Start game loop
  const startGameLoop = () => {
    gameLoopRef.current = setInterval(() => {
      updateObstacles();
      checkCollisions();
    }, 16); // ~60fps
  };
  
  // Update obstacles position
  const updateObstacles = () => {
    setObstacles(prevObstacles => {
      // Move obstacles down
      const updatedObstacles = prevObstacles.map(obstacle => {
        obstacle.position.y.value += obstacleSpeed.current;
        return obstacle;
      });
      
      // Remove obstacles that are off screen
      const visibleObstacles = updatedObstacles.filter(obstacle => obstacle.position.y.value < SCREEN_HEIGHT);
      
      // If we removed obstacles, perform memory cleanup
      if (visibleObstacles.length < updatedObstacles.length) {
        // Allow for garbage collection of off-screen obstacles
        setTimeout(() => {
          // This runs after the current render cycle, allowing React to detach
          // references to the removed obstacles
        }, 0);
      }
      
      return visibleObstacles;
    });
  };
  
  // Check for collisions
  const checkCollisions = () => {
    const playerLeft = playerPosition.value;
    const playerRight = playerPosition.value + PLAYER_SIZE;
    const playerTop = SCREEN_HEIGHT - PLATFORM_HEIGHT - PLAYER_SIZE;
    const playerBottom = SCREEN_HEIGHT - PLATFORM_HEIGHT;
    
    obstacles.forEach(obstacle => {
      const obstacleLeft = obstacle.position.x;
      const obstacleRight = obstacle.position.x + obstacle.size.width;
      const obstacleTop = obstacle.position.y.value;
      const obstacleBottom = obstacle.position.y.value + obstacle.size.height;
      
      // Check for collision
      if (
        playerLeft < obstacleRight &&
        playerRight > obstacleLeft &&
        playerTop < obstacleBottom &&
        playerBottom > obstacleTop
      ) {
        runOnJS(handleGameOver)();
      }
    });
  };
  
  // Handle screen tap
  const handleTap = (event: any) => {
    // Add this at the beginning
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
    
    // Add light haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const tapX = tapPosition.x;
    const screenCenter = SCREEN_WIDTH / 2;
    
    // Move left or right based on tap position
    if (tapX < screenCenter) {
      // Move left, but not off screen
      const newPosition = Math.max(0, playerPosition.value - PLAYER_MOVE_DISTANCE);
      playerPosition.value = withSpring(newPosition, { damping: 15, stiffness: 150 });
      playerDirection.value = withTiming(-1, { duration: 100 }, () => {
        playerDirection.value = withTiming(0, { duration: 300 });
      });
    } else {
      // Move right, but not off screen
      const newPosition = Math.min(SCREEN_WIDTH - PLAYER_SIZE, playerPosition.value + PLAYER_MOVE_DISTANCE);
      playerPosition.value = withSpring(newPosition, { damping: 15, stiffness: 150 });
      playerDirection.value = withTiming(1, { duration: 100 }, () => {
        playerDirection.value = withTiming(0, { duration: 300 });
      });
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
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (obstacleGeneratorRef.current) clearInterval(obstacleGeneratorRef.current);
      if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
      if (tutorialTimeoutRef.current) clearTimeout(tutorialTimeoutRef.current);
      if (difficultyIncreaseRef.current) clearInterval(difficultyIncreaseRef.current);
    };
  }, []);
  
  const removeTapFeedback = (id: number) => {
    setTapFeedback(prev => prev.filter(tap => tap.id !== id));
  };
  
  const removeCollisionParticles = (id: number) => {
    setCollisionParticles(prev => prev.filter(particle => particle.id !== id));
  };
  
  // Update state setter to notify parent of state changes
  const updateGameState = (newState: 'idle' | 'countdown' | 'playing' | 'gameover') => {
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

  // Adjust game parameters based on device type
  useEffect(() => {
    if (deviceType === 'tablet') {
      // Adjust game parameters for larger screens
      obstacleSpeed.current = OBSTACLE_SPEED_INITIAL * 1.2; // Faster obstacles
      
      // Generate obstacles more frequently on tablets
      if (obstacleGeneratorRef.current) {
        clearInterval(obstacleGeneratorRef.current);
        obstacleGenerationInterval.current = Math.max(
          OBSTACLE_GENERATION_INTERVAL_MIN,
          obstacleGenerationInterval.current * 0.8
        );
        obstacleGeneratorRef.current = setInterval(
          generateObstacle,
          obstacleGenerationInterval.current
        );
      }
    }
  }, [deviceType]);

  const runMemoryCleanup = () => {
    // Force garbage collection of unused objects
    setObstacles([...obstacles]);
    setTapFeedback([]);
    setCollisionParticles([]);
    
    // Reset any large data structures
    if (gameState !== 'playing') {
      playerPosition.value = SCREEN_WIDTH / 2 - PLAYER_SIZE / 2;
      playerDirection.value = 0;
    }
    
    // Log success
    console.log('Memory cleanup performed');
  };

  const testCollisionEffect = () => {
    const playerCenterX = playerPosition.value + PLAYER_SIZE / 2;
    const playerTop = SCREEN_HEIGHT - PLATFORM_HEIGHT - PLAYER_SIZE;
    
    setCollisionParticles(prev => [
      ...prev,
      {
        id: nextParticleId.current++,
        position: { x: playerCenterX, y: playerTop },
      },
    ]);
    
    // Play sound without triggering game over
    playGameSound('collision');
    
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const playGameSound = (soundName: SoundType) => {
    try {
      playSound(soundName);
    } catch (error) {
      // Silently handle sound errors to prevent game crashes
      console.log(`Could not play ${soundName} sound`);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        {!loadingComplete && (
          <Preloader 
            onComplete={() => setLoadingComplete(true)}
            assetStatus={{
              sounds: soundsLoaded,
            }}
          />
        )}
        {/* Game Background */}
        <MemoizedGameBackground isPlaying={gameState === 'playing'} />
        
        {/* Settings Button */}
        <SettingsButton muted={muted} onToggleMute={toggleMute} />
        
        {/* Score Display */}
        <ScoreDisplay score={score} gameOver={false} />
        
        {/* Game Stats Display */}
        {gameState === 'playing' && (
          <GameStats 
            difficulty={difficultyLevel} 
            obstacleSpeed={obstacleSpeed.current} 
          />
        )}
        
        {/* Platform */}
        <View style={styles.platform} />
        
        {/* Player */}
        <MemoizedPlayer position={playerPosition} direction={playerDirection} />
        
        {/* Directional Indicators */}
        <DirectionalIndicators visible={showTutorial && gameState === 'playing'} />
        
        {/* Obstacles */}
        {obstacles.map(obstacle => (
          <MemoizedObstacle 
            key={obstacle.id}
            position={obstacle.position}
            size={obstacle.size}
          />
        ))}
        
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
              obstacles: obstacles.length,
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