import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import { SharedValue } from 'react-native-reanimated';

// Game constants
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PLAYER_SIZE = 40;
const PLATFORM_HEIGHT = 20;
const OBSTACLE_MIN_WIDTH = 30;
const OBSTACLE_MAX_WIDTH = 80;
const OBSTACLE_MIN_HEIGHT = 20;
const OBSTACLE_MAX_HEIGHT = 40;
const MAX_OBSTACLES = 15; // Limit active obstacles for performance
const PLAYER_MOVE_DISTANCE = 70;

// Define game entity types for better type safety
interface GameStateEntity {
  obstacles: string[];
  obstacleSpeed: number;
  lastObstacleTime: number;
  generationInterval: number;
  minGenerationInterval: number;
  difficultyMultiplier: number;
  score: number;
  lastCollision?: {
    position: { x: number; y: number };
    obstacleId: string;
  };
}

interface PlayerEntity {
  body: Matter.Body;
  color: string;
  renderer: (props: any) => JSX.Element;
}

interface ObstacleEntity {
  body: Matter.Body;
  size: { width: number; height: number };
  color: string;
  renderer: (props: any) => JSX.Element;
}

interface PhysicsEntity {
  engine: Matter.IEngine;
  world: Matter.IWorld;
}

interface GameEntities {
  physics: PhysicsEntity;
  player: PlayerEntity;
  gameState: GameStateEntity;
  [key: string]: PlayerEntity | ObstacleEntity | PhysicsEntity | GameStateEntity;
}

// Define system event types
interface GameEvent {
  type: 'game-over' | 'move-left' | 'move-right' | 'update-player-position';
  position?: number; // For update-player-position
}

interface TimeUpdate {
  current: number;
  delta: number;
  elapsed: number;
}

// Physics system: update physics engine
const Physics = (entities: GameEntities, { time }: { time: TimeUpdate }) => {
  if (!entities.physics) return entities;
  
  const { engine } = entities.physics;
  
  // Use default delta or cap to prevent large jumps on slow devices
  const delta = time.delta ? Math.min(time.delta, 50) : 16.667;
  
  // Update physics with proper delta time
  Matter.Engine.update(engine, delta);
  return entities;
};

// Improved obstacle generation system
const ObstacleGenerator = (
  entities: GameEntities, 
  { time, dispatch }: { time: TimeUpdate; dispatch: (event: GameEvent) => void }
) => {
  if (!entities.gameState || !entities.player) return entities;
  
  const world = entities.physics.world;
  const { obstacleSpeed, lastObstacleTime, generationInterval, obstacles } = entities.gameState;
  
  // Generate obstacles at specified interval
  if (time.current - lastObstacleTime >= generationInterval && obstacles.length < MAX_OBSTACLES) {
    entities.gameState.lastObstacleTime = time.current;
    
    // Create new obstacle with some size variety
    const width = Math.random() * (OBSTACLE_MAX_WIDTH - OBSTACLE_MIN_WIDTH) + OBSTACLE_MIN_WIDTH;
    const height = Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT) + OBSTACLE_MIN_HEIGHT;
    
    // Get player position for smarter placement
    const player = entities.player.body;
    const playerLeft = player.position.x - PLAYER_SIZE/2;
    const playerRight = player.position.x + PLAYER_SIZE/2;
    
    // Create wider safe zone for difficulty-based spacing
    const safeZoneWidth = PLAYER_SIZE * (3 - entities.gameState.difficultyMultiplier * 0.5);
    const safeZoneLeft = Math.max(0, playerLeft - safeZoneWidth/2);
    const safeZoneRight = Math.min(SCREEN_WIDTH, playerRight + safeZoneWidth/2);
    
    // Determine obstacle x position with improved spawning logic
    let x;
    
    // Determine available space on each side
    const leftSpaceAvailable = safeZoneLeft;
    const rightSpaceAvailable = SCREEN_WIDTH - safeZoneRight;
    
    if (leftSpaceAvailable >= width && rightSpaceAvailable >= width) {
      // Space on both sides, randomly choose with slight bias toward more open side
      const ratio = leftSpaceAvailable / (leftSpaceAvailable + rightSpaceAvailable);
      if (Math.random() < ratio) {
        // Place on left
        x = Math.random() * (leftSpaceAvailable - width);
      } else {
        // Place on right
        x = safeZoneRight + Math.random() * (rightSpaceAvailable - width);
      }
    } else if (leftSpaceAvailable >= width) {
      // Only enough space on left
      x = Math.random() * (leftSpaceAvailable - width);
    } else if (rightSpaceAvailable >= width) {
      // Only enough space on right
      x = safeZoneRight + Math.random() * (rightSpaceAvailable - width);
    } else {
      // No good space, pick random position but try to avoid direct player path
      const playerCenter = player.position.x;
      let attempts = 0;
      
      // Try a few times to find a good position away from player
      do {
        x = Math.random() * (SCREEN_WIDTH - width);
        attempts++;
      } while (
        Math.abs((x + width/2) - playerCenter) < PLAYER_SIZE && 
        attempts < 5
      );
    }
    
    // Create unique ID with timestamp for tracking
    const obstacleId = `obstacle-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create the obstacle body with appropriate properties
    const obstacle = Matter.Bodies.rectangle(
      x + width/2,  // Matter.js uses center position
      -height - (Math.random() * 50), // Add randomness to initial Y for more natural patterns
      width,
      height,
      { 
        isStatic: false,
        restitution: 0,
        friction: 0.01,
        frictionAir: 0,
        label: 'obstacle',
        collisionFilter: {
          category: 0x0002,
          mask: 0x0001,  // Only collide with player
        },
        // Store additional data for rendering
        render: {
          fillStyle: '#EF4444'
        }
      }
    );
    
    // Add to world
    Matter.Composite.add(world, obstacle);
    
    // Add to entities
    entities[obstacleId] = {
      body: obstacle,
      size: { width, height },
      color: '#EF4444',
      renderer: ObstacleRenderer
    } as ObstacleEntity;
    
    // Add to tracking array
    entities.gameState.obstacles.push(obstacleId);
    
    // Adjust generation interval based on number of obstacles (dynamic difficulty)
    if (obstacles.length > 5) {
      entities.gameState.generationInterval = Math.max(
        entities.gameState.minGenerationInterval, 
        entities.gameState.generationInterval * 0.99
      );
    }
  }
  
  return entities;
};

// Improved obstacle movement system
const ObstacleMovement = (
  entities: GameEntities, 
  { time }: { time: TimeUpdate }
) => {
  if (!entities.gameState) return entities;
  
  const { obstacles, obstacleSpeed } = entities.gameState;
  const world = entities.physics.world;
  const obstaclesToRemove: string[] = [];
  
  // Calculate speed adjustment based on frame rate
  const speedMultiplier = Math.min(time.delta / 16.667, 2); // 60fps = 16.667ms per frame
  const adjustedSpeed = obstacleSpeed * speedMultiplier;
  
  // Move each obstacle down
  obstacles.forEach(obstacleId => {
    const obstacle = entities[obstacleId] as ObstacleEntity | undefined;
    if (obstacle && obstacle.body) {
      // Apply vertical velocity with frame-rate independent adjustment
      Matter.Body.setVelocity(obstacle.body, { 
        x: 0, 
        y: adjustedSpeed
      });
      
      // Add slight rotation for visual interest (optional)
      if (Math.random() < 0.01) {
        const rotationAmount = (Math.random() - 0.5) * 0.05;
        Matter.Body.setAngularVelocity(obstacle.body, rotationAmount);
      }
      
      // Check if obstacle is off screen with buffer
      if (obstacle.body.position.y > SCREEN_HEIGHT + obstacle.size.height * 2) {
        obstaclesToRemove.push(obstacleId);
      }
    }
  });
  
  // Clean up off-screen obstacles with better error handling
  obstaclesToRemove.forEach(obstacleId => {
    try {
      const obstacle = entities[obstacleId] as ObstacleEntity | undefined;
      if (obstacle && obstacle.body) {
        Matter.Composite.remove(world, obstacle.body, true);
        delete entities[obstacleId];
        entities.gameState.obstacles = entities.gameState.obstacles.filter(id => id !== obstacleId);
      }
    } catch (error) {
      console.log('Error removing obstacle:', error);
    }
  });
  
  return entities;
};

// Update the CollisionSystem with better type safety
const CollisionSystem = (
  entities: GameEntities, 
  { dispatch }: { dispatch: (event: GameEvent) => void }
) => {
  if (!entities.gameState || !entities.player) return entities;
  
  const player = entities.player.body;
  const { obstacles } = entities.gameState;
  
  // Check collisions between player and obstacles with better precision
  for (const obstacleId of obstacles) {
    const obstacle = entities[obstacleId] as ObstacleEntity | undefined;
    if (obstacle && obstacle.body) {
      // Safety check for bounds property
      if (!player.bounds || !obstacle.body.bounds) continue;
      
      const playerBounds = player.bounds;
      const obstacleBounds = obstacle.body.bounds;
      
      // Check if bounding boxes overlap
      if (
        playerBounds.max.x > obstacleBounds.min.x &&
        playerBounds.min.x < obstacleBounds.max.x &&
        playerBounds.max.y > obstacleBounds.min.y &&
        playerBounds.min.y < obstacleBounds.max.y
      ) {
        // Collision detected - store collision data
        entities.gameState.lastCollision = {
          position: {
            x: obstacle.body.position.x,
            y: obstacle.body.position.y
          },
          obstacleId
        };
        
        // Dispatch game over event
        dispatch({ type: 'game-over' });
        break;
      }
    }
  }
  
  return entities;
};

// Improved player control system with smooth motion
const PlayerControl = (
  entities: GameEntities, 
  { events, dispatch }: { events?: GameEvent[]; dispatch: (event: GameEvent) => void }
) => {
  if (!entities.player) return entities;
  
  const player = entities.player.body;
  
  if (events && events.length) {
    events.forEach(event => {
      if (event.type === 'move-left') {
        // Move player left with bounds checking
        const newX = Math.max(PLAYER_SIZE/2, player.position.x - PLAYER_MOVE_DISTANCE);
        Matter.Body.setPosition(player, { x: newX, y: player.position.y });
        
        // Apply slight tilt for visual feedback
        Matter.Body.setAngle(player, -0.1);
        
        // Dispatch position update to sync UI
        dispatch({ 
          type: 'update-player-position', 
          position: newX - PLAYER_SIZE/2 
        });
        
        // Set up auto-revert to straight position
        setTimeout(() => {
          if (entities.player && entities.player.body) {
            Matter.Body.setAngle(entities.player.body, 0);
          }
        }, 150);
      } else if (event.type === 'move-right') {
        // Similar changes for move-right...
        const newX = Math.min(SCREEN_WIDTH - PLAYER_SIZE/2, player.position.x + PLAYER_MOVE_DISTANCE);
        Matter.Body.setPosition(player, { x: newX, y: player.position.y });
        
        // Apply slight tilt for visual feedback
        Matter.Body.setAngle(player, 0.1);
        
        // Dispatch position update to sync UI
        dispatch({ 
          type: 'update-player-position', 
          position: newX - PLAYER_SIZE/2 
        });
        
        // Set up auto-revert to straight position
        setTimeout(() => {
          if (entities.player && entities.player.body) {
            Matter.Body.setAngle(entities.player.body, 0);
          }
        }, 150);
      } else if (event.type === 'update-player-position' && typeof event.position === 'number') {
        // Update player position from external source (UI layer)
        Matter.Body.setPosition(player, { 
          x: event.position + PLAYER_SIZE/2, 
          y: player.position.y 
        });
      }
    });
  }
  
  return entities;
};

// Update to sync player position with external components
const PlayerPositionSync = (
  entities: GameEntities,
  { dispatch }: { dispatch: (event: GameEvent) => void }
) => {
  if (!entities.player) return entities;
  
  // This is where you would update external components about player position
  // Using a callback passed via props in the main component
  
  return entities;
};

// Define renderer prop types
interface RendererProps {
  body: Matter.Body;
  color: string;
  size?: { width: number; height: number };
}

// Improved player renderer
const PlayerRenderer = (props: RendererProps) => {
  const { body, color } = props;
  
  // Calculate corner positions accounting for rotation
  const angle = body.angle;
  const centerX = body.position.x;
  const centerY = body.position.y;
  const halfSize = PLAYER_SIZE / 2;
  
  // Apply transform based on body rotation
  const transform = [
    { translateX: -halfSize },
    { translateY: -halfSize },
    { rotate: `${angle}rad` },
    { translateX: halfSize },
    { translateY: halfSize },
  ];
  
  return (
    <View 
      style={[
        styles.player, 
        { 
          left: centerX - halfSize, 
          top: centerY - halfSize,
          backgroundColor: color,
          transform
        }
      ]} 
    />
  );
};

// Improved obstacle renderer
const ObstacleRenderer = (props: RendererProps) => {
  const { body, size, color } = props;
  
  if (!size) {
    return null; // Handle missing size gracefully
  }
  
  const x = body.position.x - size.width/2;
  const y = body.position.y - size.height/2;
  
  // Apply rotation to the obstacle
  const transform = [
    { translateX: size.width/2 },
    { translateY: size.height/2 },
    { rotate: `${body.angle}rad` },
    { translateX: -size.width/2 },
    { translateY: -size.height/2 },
  ];
  
  return (
    <View 
      style={[
        styles.obstacle, 
        { 
          left: x, 
          top: y, 
          width: size.width, 
          height: size.height,
          backgroundColor: color,
          transform
        }
      ]} 
    />
  );
};

// Interface for component props
interface PhysicsGameEngineProps {
  difficultyLevel?: number;
  isPlaying?: boolean;
  deviceType?: 'phone' | 'tablet';
  isDevMode?: boolean;
  onUpdate?: (data: { 
    playerPosition?: number;
    obstacleCount?: number; 
    collision?: { x: number, y: number };
    fps?: number; // Add FPS reporting
  }) => void;
  playerDirection?: SharedValue<number>;
  debugMode?: boolean; // Add debug mode toggle
}

// Add this type declaration at the top of your file
interface ExtendedGameEngine extends GameEngine {
  dispatch: (event: GameEvent) => void;
}

// Expand the PhysicsGameEngineRef interface for better control
interface PhysicsGameEngineRef {
  cleanupEntities: () => void;
  handlePlayerMovement: (tapX: number) => void;
  pausePhysics: () => void;
  resumePhysics: () => void;
  getObstacleCount: () => number;
}

// Game setup - significantly improved
const PhysicsGameEngine = forwardRef<PhysicsGameEngineRef, PhysicsGameEngineProps>(({ 
  difficultyLevel = 1,
  isPlaying = false,
  deviceType = 'phone',
  isDevMode = false,
  onUpdate,
  playerDirection,
  debugMode = false
}, ref) => {
  const [entities, setEntities] = useState<GameEntities | null>(null);
  const [obstacleCount, setObstacleCount] = useState(0);
  const engineRef = useRef<ExtendedGameEngine>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add FPS tracking
  const frameCount = useRef(0);
  const lastFpsUpdateTime = useRef(0);
  const currentFps = useRef(0);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    cleanupEntities: () => {
      cleanupEntities();
    },
    handlePlayerMovement: (tapX: number) => {
      if (!isPlaying || !engineRef.current) return;
      
      const screenCenter = SCREEN_WIDTH / 2;
      
      if (tapX < screenCenter) {
        // Update player direction for visual effects
        if (playerDirection) {
          playerDirection.value = -1;
          setTimeout(() => {
            if (playerDirection) playerDirection.value = 0;
          }, 300);
        }
        
        // Move player left with bounds checking
        if (entities?.player?.body) {
          const player = entities.player.body;
          const newX = Math.max(PLAYER_SIZE/2, player.position.x - PLAYER_MOVE_DISTANCE);
          Matter.Body.setPosition(player, { x: newX, y: player.position.y });
          
          // Ensure UI gets updated
          if (onUpdate) {
            onUpdate({ 
              playerPosition: newX - PLAYER_SIZE/2,
              obstacleCount: entities.gameState.obstacles.length,
              fps: currentFps.current
            });
          }
        }
      } else {
        // Update player direction for visual effects
        if (playerDirection) {
          playerDirection.value = 1;
          setTimeout(() => {
            if (playerDirection) playerDirection.value = 0;
          }, 300);
        }
        
        // Move player right with bounds checking
        if (entities?.player?.body) {
          const player = entities.player.body;
          const newX = Math.min(SCREEN_WIDTH - PLAYER_SIZE/2, player.position.x + PLAYER_MOVE_DISTANCE);
          Matter.Body.setPosition(player, { x: newX, y: player.position.y });
          
          // Ensure UI gets updated
          if (onUpdate) {
            onUpdate({ 
              playerPosition: newX - PLAYER_SIZE/2,
              obstacleCount: entities.gameState.obstacles.length,
              fps: currentFps.current
            });
          }
        }
      }
    },
    pausePhysics: () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    },
    resumePhysics: () => {
      if (!updateIntervalRef.current && entities) {
        setupUpdateInterval();
      }
    },
    // Method to get current obstacle count
    getObstacleCount: () => entities?.gameState?.obstacles?.length || 0
  }));
  
  // Set up physics engine and entities when game starts
  useEffect(() => {
    if (isPlaying) {
      setupEntities();
      
      // Start sending updates at 60fps
      if (onUpdate) {
        updateIntervalRef.current = setInterval(() => {
          if (entities?.player?.body) {
            const playerX = entities.player.body.position.x - PLAYER_SIZE/2;
            onUpdate({ 
              playerPosition: playerX,
              obstacleCount: entities.gameState.obstacles.length,
              fps: currentFps.current
            });
          }
        }, 16);
      }
    } else {
      // Clean up when game is no longer playing
      cleanupEntities();
      
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    }
    
    return () => {
      cleanupEntities();
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [isPlaying, difficultyLevel]);
  
  // Update obstacle count for external components
  useEffect(() => {
    if (entities?.gameState?.obstacles) {
      setObstacleCount(entities.gameState.obstacles.length);
    }
  }, [entities?.gameState?.obstacles]);
  
  // Clean up physics entities
  const cleanupEntities = () => {
    if (entities?.physics?.engine) {
      try {
        // Proper cleanup of physics world
        Matter.World.clear(entities.physics.world);
        Matter.Engine.clear(entities.physics.engine);
        setEntities(null);
      } catch (error) {
        console.log('Error cleaning up physics engine:', error);
      }
    }
  };
  
  // Set up game entities with improved parameters
  const setupEntities = () => {
    // Create physics engine with optimal settings
    const engine = Matter.Engine.create({ 
      enableSleeping: false,
      constraintIterations: 2,
      positionIterations: 6,
      velocityIterations: 4
    });
    
    // Add ability to enable/disable collision detection in dev mode
    if (isDevMode) {
      engine.enableSleeping = false;
      engine.positionIterations = debugMode ? 8 : 6;  // Better precision in debug mode
      engine.velocityIterations = debugMode ? 6 : 4;
    }
    
    const world = engine.world;
    
    // Disable gravity - we'll control movement manually
    engine.gravity.y = 0;
    
    // Create player body at center
    const player = Matter.Bodies.rectangle(
      SCREEN_WIDTH / 2,
      SCREEN_HEIGHT - PLATFORM_HEIGHT - PLAYER_SIZE/2,
      PLAYER_SIZE,
      PLAYER_SIZE,
      { 
        isStatic: true,
        label: 'player',
        chamfer: { radius: 4 }, // Rounded corners
        collisionFilter: {
          category: 0x0001,
          mask: 0x0002, // Only collide with obstacles
        }
      }
    );
    
    // Add bodies to world
    Matter.Composite.add(world, [player]);
    
    // Configure base speed and generation interval based on difficulty and device type
    let baseObstacleSpeed = 3 + (difficultyLevel * 0.3);
    let baseGenerationInterval = Math.max(800, 2000 - (difficultyLevel * 150));
    
    // Adjust for tablet
    if (deviceType === 'tablet') {
      baseObstacleSpeed *= 1.2;
      baseGenerationInterval *= 0.8;
    }
    
    // Create game entities
    const newEntities: GameEntities = {
      physics: { engine, world },
      player: {
        body: player,
        color: '#3B82F6',
        renderer: PlayerRenderer,
      },
      gameState: {
        obstacles: [],
        obstacleSpeed: baseObstacleSpeed,
        lastObstacleTime: 0,
        generationInterval: baseGenerationInterval,
        minGenerationInterval: Math.max(400, baseGenerationInterval * 0.5),
        difficultyMultiplier: difficultyLevel / 10 + 0.5, // Normalized difficulty
        score: 0
      }
    };
    
    setEntities(newEntities);
  };
  
  // Handle events from game engine
  const onEvent = (e: GameEvent) => {
    if (e.type === 'game-over' && entities?.gameState?.lastCollision && onUpdate) {
      // Send collision position to parent for visual effects
      onUpdate({ 
        collision: entities.gameState.lastCollision.position 
      });
    }
    
    // Count frames for FPS calculation
    frameCount.current += 1;
    const now = Date.now();
    
    // Calculate FPS every second
    if (now - lastFpsUpdateTime.current >= 1000) {
      currentFps.current = frameCount.current;
      frameCount.current = 0;
      lastFpsUpdateTime.current = now;
      
      if (onUpdate) {
        onUpdate({ fps: currentFps.current });
      }
    }
  };
  
  // Helper method for setting up the update interval
  const setupUpdateInterval = () => {
    if (onUpdate) {
      updateIntervalRef.current = setInterval(() => {
        if (entities?.player?.body) {
          const playerX = entities.player.body.position.x - PLAYER_SIZE/2;
          onUpdate({ 
            playerPosition: playerX,
            obstacleCount: entities.gameState.obstacles.length,
            fps: currentFps.current
          });
        }
      }, 16);
    }
  };
  
  // Don't render anything if not playing or entities not set up
  if (!isPlaying) {
    return <View style={styles.container} />;
  }
  
  return (
    <View style={styles.container}>
      {entities && (
        <GameEngine
          ref={engineRef as React.RefObject<GameEngine>}
          style={styles.gameContainer}
          systems={[
            Physics, 
            ObstacleGenerator, 
            ObstacleMovement, 
            CollisionSystem, 
            PlayerControl,
            PlayerPositionSync
          ]}
          entities={entities}
          onEvent={onEvent}
          running={isPlaying}
        />
      )}
      <View style={styles.platform} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gameContainer: {
    flex: 1,
  },
  platform: {
    position: 'absolute',
    bottom: 0,
    width: SCREEN_WIDTH,
    height: PLATFORM_HEIGHT,
    backgroundColor: '#4B5563',
  },
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  obstacle: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});

export default PhysicsGameEngine;