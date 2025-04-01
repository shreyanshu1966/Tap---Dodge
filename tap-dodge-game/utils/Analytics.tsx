import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the types of events we want to track
export type GameEvent = 
  | 'game_start'
  | 'game_over'
  | 'level_up'
  | 'app_launch'
  | 'settings_change';

// Define what the event data will look like
interface EventData {
  event: GameEvent; // Add the 'event' property here
  timestamp: number;
  score?: number;
  level?: number;
  playDuration?: number;
  setting?: string;
  value?: any;
  newHighScore?: boolean; // Add this line to include the newHighScore property
}

// The main analytics class
export class Analytics {
  private static readonly STORAGE_KEY = '@tap_dodge_analytics';
  private static readonly MAX_EVENTS = 100; // Limit stored events
  private static eventsCache: EventData[] | null = null; // Use EventData[] for type safety
  
  // Track a game event
  public static async trackEvent(event: GameEvent, data: Partial<EventData> = {}) {
    try {
      // Create new event with timestamp
      const newEvent: EventData = {
        event,
        ...data,
        timestamp: Date.now(),
      };
      
      // Use in-memory cache if available to avoid reading from storage every time
      let events = this.eventsCache || await this.getEvents();
      
      // Add to events array, keeping only the most recent MAX_EVENTS
      events = [...events, newEvent].slice(-this.MAX_EVENTS);
      
      // Update cache
      this.eventsCache = events;
      
      // Save back to storage (don't await this to make tracking faster)
      AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(events))
        .catch(error => console.error('Failed to save analytics event:', error));
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }
  
  // Get all stored events
  public static async getEvents(): Promise<EventData[]> {
    try {
      // Return from cache if available
      if (this.eventsCache) return [...this.eventsCache];
      
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      const events: EventData[] = data ? JSON.parse(data) : [];
      
      // Update cache
      this.eventsCache = events;
      
      return events;
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }
  
  // Clear all stored events
  public static async clearEvents() {
    try {
      this.eventsCache = [];
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear events:', error);
    }
  }
  
  // Get statistics based on stored events
  public static async getStats() {
    const events = await this.getEvents();

    // Calculate basic stats
    const gameStarts = events.filter(e => e.event === 'game_start').length;
    const gameOvers = events.filter(e => e.event === 'game_over').length;

    // Get scores and calculate average
    const scores = events
      .filter(e => e.event === 'game_over' && typeof e.score === 'number')
      .map(e => e.score as number);

    const avgScore = scores.length
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    // Get highest score
    const highestScore = scores.length ? Math.max(...scores) : 0;

    // Return the complete stats object with all properties
    return {
      totalGamesPlayed: gameStarts,
      totalGamesCompleted: gameOvers,
      averageScore: Math.round(avgScore),
      highestScore,
      completionRate: gameStarts ? (gameOvers / gameStarts) * 100 : 0,
    };
  }
}