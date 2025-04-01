export type RootStackParamList = {
  Home: undefined;
  Game: undefined;
  Instructions: undefined;
  Stats: undefined;
  NotFound: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}