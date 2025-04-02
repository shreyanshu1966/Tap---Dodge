declare module 'react-native-game-engine' {
  import React from 'react';
  import { ViewProps } from 'react-native';

  export interface GameEngineProps extends ViewProps {
    systems: Function[];
    entities: any;
    renderer?: Function;
    running?: boolean;
    onEvent?: (e: any) => void;
    timer?: {
      timestep?: number;
    };
  }

  export class GameEngine extends React.Component<GameEngineProps> {
    dispatch(event: any): void;
    swap(entities: any): void;
    stop(): void;
    start(): void;
  }
}