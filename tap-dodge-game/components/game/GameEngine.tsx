import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { View, StyleSheet, Dimensions, TouchableWithoutFeedback, Text, Platform } from 'react-native';
import Animated, { useSharedValue, withSpring, runOnJS, withTiming } from 'react-native-reanimated';
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
  const obstacleYPositions = useRef<{ [key: number]: Animated.SharedValue<number> }>({});
  const gameStateRef = useRef<'idle' | 'countdown' | 'playing' | 'gameover'>('idle');
  
  // Create a pool of shared values at component level
  const MAX_OBSTACLES = 20; // Maximum number of obstacles on screen at once
  
  // Create all shared values at the top level instead of in a loop
  const sv1 = useSharedValue(-100);
  const sv2 = useSharedValue(-100);
  const sv3 = useSharedValue(-100);
  const sv4 = useSharedValue(-100);
  const sv5 = useSharedValue(-100);
  const sv6 = useSharedValue(-100);
  const sv7 = useSharedValue(-100);
  const sv8 = useSharedValue(-100);
  const sv9 = useSharedValue(-100);
  const sv10 = useSharedValue(-100);
  const sv11 = useSharedValue(-100);
  const sv12 = useSharedValue(-100);
  const sv13 = useSharedValue(-100);
  const sv14 = useSharedValue(-100);
  const sv15 = useSharedValue(-100);
  const sv16 = useSharedValue(-100);
  const sv17 = useSharedValue(-100);
  const sv18 = useSharedValue(-100);
  const sv19 = useSharedValue(-100);
  const sv20 = useSharedValue(-100);
  
  const sharedValuePool = useRef<Animated.SharedValue<number>[]>([]);

  // Initialize pool in a useEffect
  useEffect(() => {
    // Add all pre-created shared values to the pool
    sharedValuePool.current = [
      sv1, sv2, sv3, sv4, sv5, sv6, sv7, sv8, sv9, sv10,
      sv11, sv12, sv13, sv14, sv15, sv16, sv17, sv18, sv19, sv20
    ];
  }, []);

  // Timers and intervals
  const gameLoopRef = useRef<number | null>(null);
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
    
    // Start game loop
    startGameLoop();
    
    // Clear any existing obstacle generator interval
    if (obstacleGeneratorRef.current) {
      clearInterval(obstacleGeneratorRef.current);
      obstacleGeneratorRef.current = null;
    }

    // Generate first obstacle immediately
    generateObstacle();
    
    // Set up interval for subsequent obstacles
    obstacleGeneratorRef.current = setInterval(() => {
      if (gameStateRef.current === 'playing') { // Use ref instead of state
        generateObstacle();
      }
    }, obstacleGenerationInterval.current);
    
    // Start score counter
    scoreIntervalRef.current = setInterval(() => {
      setScore(prev => prev + 1);
    }, SCORE_INCREMENT_INTERVAL);
    
    // Start difficulty increase timer
    difficultyIncreaseRef.current = setInterval(() => {
      increaseDifficulty();
    }, DIFFICULTY_INCREASE_INTERVAL);
  };
  
  // Add this utility function to safely use haptics
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
      
      // Use the safe haptics function
      triggerHaptic('notification', Haptics.NotificationFeedbackType.Success);
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
    
    // Use the safe haptics function
    triggerHaptic('notification', Haptics.NotificationFeedbackType.Error);
    
    updateGameState('gameover');
    
    // Stop all intervals and timeouts
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    if (obstacleGeneratorRef.current) clearInterval(obstacleGeneratorRef.current);
    if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
    if (tutorialTimeoutRef.current) clearTimeout(tutorialTimeoutRef.current);
    if (difficultyIncreaseRef.current) clearInterval(difficultyIncreaseRef.current);
    
    // Notify parent component
    if (onGameOver) onGameOver(score);
  };
  
  // Update the generateObstacle function to be more reliable
const generateObstacle = () => {
  // Ensure we're still in playing state
  if (gameStateRef.current !== 'playing') return;
  
  // Limit maximum obstacles for performance
  if (obstacles.length >= MAX_OBSTACLES) return;
  
  // Generate obstacle with random properties
  const width = Math.random() * (OBSTACLE_MAX_WIDTH - OBSTACLE_MIN_WIDTH) + OBSTACLE_MIN_WIDTH;
  const height = Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT) + OBSTACLE_MIN_HEIGHT;
  
  // Better obstacle placement logic
  const playerCenter = playerPosition.value + (PLAYER_SIZE / 2);
  const safeZoneWidth = PLAYER_SIZE * 2.5; // Slightly wider safe zone
  const safeZoneLeft = Math.max(0, playerCenter - safeZoneWidth);
  const safeZoneRight = Math.min(SCREEN_WIDTH, playerCenter + safeZoneWidth);
  
  // Generate x position with improved algorithm
  let x: number;
  
  // Decide which side to generate on based on player position
  if (playerCenter < SCREEN_WIDTH / 3) {
    // Player is on left side, more likely to generate on right
    x = safeZoneRight + Math.random() * (SCREEN_WIDTH - safeZoneRight - width);
  } else if (playerCenter > SCREEN_WIDTH * 2/3) {
    // Player is on right side, more likely to generate on left
    x = Math.random() * (safeZoneLeft - width);
  } else {
    // Player is in middle, generate on either side
    x = Math.random() > 0.5 
      ? Math.random() * Math.max(0, safeZoneLeft - width)
      : Math.min(SCREEN_WIDTH - width, safeZoneRight) + Math.random() * Math.max(0, SCREEN_WIDTH - safeZoneRight - width);
  }
  
  // Fallback if calculation resulted in invalid position
  if (isNaN(x) || x < 0 || x > SCREEN_WIDTH - width) {
    x = Math.random() * (SCREEN_WIDTH - width);
  }
  
  // Get a shared value from the pool with proper error handling
  const poolIndex = obstacles.length % MAX_OBSTACLES;
  const yPosition = sharedValuePool.current[poolIndex];
  
  if (!yPosition) return;
  
  // Position above screen with random starting point for natural falling pattern
  yPosition.value = -height - (Math.random() * 50);
  
  // Store reference and create new obstacle
  const newId = nextObstacleId.current++;
  obstacleYPositions.current[newId] = yPosition;
  
  // Add the new obstacle to state
  setObstacles(prev => [
    ...prev, 
    {
      id: newId,
      position: { x, y: yPosition },
      size: { width, height },
    }
  ]);
};

// Replace the startGameLoop function with this more efficient version
const startGameLoop = () => {
  if (gameLoopRef.current) {
    cancelAnimationFrame(gameLoopRef.current);
  }
  
  let lastTime = performance.now();
  const targetFrameTime = 1000 / 60; // Target 60 FPS
  
  const gameLoop = () => {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    
    if (deltaTime >= targetFrameTime) {
      if (gameStateRef.current === 'playing') {
        // Use deltaTime to make animations frame rate independent
        const speedFactor = deltaTime / targetFrameTime;
        updateObstaclesWithDelta(speedFactor);
        checkCollisions();
      }
      lastTime = currentTime;
    }
    
    // Continue the game loop if still playing
    if (gameStateRef.current === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  };
  
  // Start the game loop using requestAnimationFrame for better timing
  gameLoopRef.current = requestAnimationFrame(gameLoop);
};

// Add this new function to update obstacles with delta time
const updateObstaclesWithDelta = (speedFactor: number) => {
  // Only update obstacles when game is playing
  if (gameStateRef.current !== 'playing') return;

  setObstacles(prevObstacles => {
    const obstaclesToKeep: typeof prevObstacles = [];
    
    // Update positions with delta time adjustment
    for (const obstacle of prevObstacles) {
      if (!obstacle.position.y) continue;
      
      // Update position
      obstacle.position.y.value += obstacleSpeed.current * speedFactor;
      
      // Check if still visible
      if (obstacle.position.y.value < SCREEN_HEIGHT) {
        obstaclesToKeep.push(obstacle);
      } else {
        // Clean up and reset for reuse
        delete obstacleYPositions.current[obstacle.id];
        obstacle.position.y.value = -100;
      }
    }
    
    // Return the filtered list
    return obstaclesToKeep;
  });
};

// Replace the updateObstacles function with this improved version
const updateObstacles = () => {
  // Only update obstacles when game is playing
  if (gameStateRef.current !== 'playing') return;

  // Create a copy of current obstacles to avoid mutation issues
  const currentObstacles = [...obstacles];
  const offScreenObstacles: number[] = []; // Add explicit type
  
  // First pass: Update all obstacle positions
  currentObstacles.forEach(obstacle => {
    if (obstacle.position.y && typeof obstacle.position.y !== 'undefined') {
      obstacle.position.y.value += obstacleSpeed.current;
    }
  });
  
  // Second pass: Filter out obstacles that are off screen
  const remainingObstacles = currentObstacles.filter(obstacle => {
    const yPosition = obstacle.position.y;
    if (!yPosition || typeof yPosition === 'undefined') return false;
    
    const isOffScreen = yPosition.value > SCREEN_HEIGHT;
    if (isOffScreen) {
      // Mark for cleanup but don't modify the array while iterating
      offScreenObstacles.push(obstacle.id);
      // Reset position for reuse
      yPosition.value = -100;
      return false;
    }
    return true;
  });
  
  // Update state only if obstacles have changed
  if (remainingObstacles.length !== currentObstacles.length) {
    setObstacles(remainingObstacles);
    
    // Clean up the obstacle position references
    offScreenObstacles.forEach(id => {
      delete obstacleYPositions.current[id];
    });
  }
};

// Optimize the checkCollisions function
const checkCollisions = () => {
  if (gameStateRef.current !== 'playing') return;
  
  // Get current player position values - calculate once for efficiency
  const playerLeft = playerPosition.value;
  const playerRight = playerPosition.value + PLAYER_SIZE;
  const playerTop = SCREEN_HEIGHT - PLATFORM_HEIGHT - PLAYER_SIZE;
  const playerBottom = SCREEN_HEIGHT - PLATFORM_HEIGHT;
  
  // Use a slightly smaller hitbox for more forgiving collisions
  const collisionBuffer = 5;
  const playerHitboxLeft = playerLeft + collisionBuffer;
  const playerHitboxRight = playerRight - collisionBuffer;
  const playerHitboxTop = playerTop + collisionBuffer;
  
  // Only check obstacles that are in the collision zone (near the player)
  const potentialCollisions = obstacles.filter(obstacle => {
    if (!obstacle.position.y) return false;
    const obstacleTop = obstacle.position.y.value;
    const obstacleBottom = obstacleTop + obstacle.size.height;
    
    // Is the obstacle near the bottom of the screen where player is?
    return obstacleBottom >= playerTop && obstacleTop <= playerBottom;
  });
  
  // Check each potential collision with improved precision
  for (const obstacle of potentialCollisions) {
    if (!obstacle.position.y) continue;
    
    const obstacleLeft = obstacle.position.x;
    const obstacleRight = obstacle.position.x + obstacle.size.width;
    const obstacleTop = obstacle.position.y.value;
    const obstacleBottom = obstacleTop + obstacle.size.height;
    
    // Add small buffer at the bottom of obstacles for more forgiving collisions
    const obstacleHitboxBottom = obstacleBottom - collisionBuffer;
    
    // Check for collision with adjusted hitboxes
    if (
      playerHitboxRight > obstacleLeft &&
      playerHitboxLeft < obstacleRight &&
      playerHitboxTop < obstacleHitboxBottom &&
      playerBottom > obstacleTop
    ) {
      // Call handleGameOver through runOnJS for thread safety
      runOnJS(handleGameOver)();
      break;
    }
  }
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
    
    // Use the safe haptics function
    triggerHaptic('impact', Haptics.ImpactFeedbackStyle.Light);
    
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
    
    // Use the safe haptics function
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

  // Add this useEffect for debugging
  useEffect(() => {
    console.log(`Obstacles state updated: ${obstacles.length} obstacles`);
  }, [obstacles]);

  // Add this effect to watch for game state changes
  useEffect(() => {
    if (gameState === 'playing') {
      console.log('Game state is now playing, generating first obstacle');
      // Generate first obstacle immediately when state becomes 'playing'
      generateObstacle();
    }
  }, [gameState]);

  // Add a gameState cleanup effect
  useEffect(() => {
    // When game state changes to 'playing', clean up any stale intervals
    if (gameState === 'playing') {
      if (obstacleGeneratorRef.current) {
        clearInterval(obstacleGeneratorRef.current);
      }
      
      // Set up fresh interval
      obstacleGeneratorRef.current = setInterval(() => {
        generateObstacle();
      }, obstacleGenerationInterval.current);
    }
    
    // Cleanup on state change
    return () => {
      if (obstacleGeneratorRef.current) {
        clearInterval(obstacleGeneratorRef.current);
      }
    };
  }, [gameState]);

  // Add this function before the useEffect that returns cleanup
const cleanup = () => {
  // Cancel animation frame instead of clearing timeout
  if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
  
  // Clear all intervals and timeouts
  if (obstacleGeneratorRef.current) clearInterval(obstacleGeneratorRef.current);
  if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
  if (tutorialTimeoutRef.current) clearTimeout(tutorialTimeoutRef.current);
  if (difficultyIncreaseRef.current) clearInterval(difficultyIncreaseRef.current);
  if (devTapTimer.current) clearTimeout(devTapTimer.current);
  
  // Reset shared values
  sharedValuePool.current.forEach(sv => {
    if (sv) sv.value = -100;
  });
};

// Now the useEffect can properly use the cleanup function
useEffect(() => {
  return cleanup;
}, []);

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
            key={`obstacle-${obstacle.id}`}
            position={{
              x: obstacle.position.x,
              y: obstacle.position.y, // Pass the entire shared value, don't access .value
            }}
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