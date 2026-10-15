import { GameState } from '../types/game';

type StateListener = (newState: GameState, oldState: GameState) => void;

export class StateManager {
  private currentState: GameState = 'MENU';
  private listeners: Set<StateListener> = new Set();

  public getState(): GameState {
    return this.currentState;
  }

  public setState(nextState: GameState): void {
    if (this.currentState === nextState) return;
    const prevState = this.currentState;
    this.currentState = nextState;
    this.listeners.forEach((listener) => listener(nextState, prevState));
  }

  public onChange(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}