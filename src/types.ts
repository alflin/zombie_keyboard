export interface ZombieType {
  id: string;
  word: string;
  x: number; // 0 to 100 (percentage)
  y: number; // 0 to 100 (percentage, starts at -10 or something)
  speed: number;
  maxHealth: number;
  currentHealth: number;
}

export interface GameState {
  status: 'idle' | 'playing' | 'gameover';
  score: number;
  health: number;
  level: number;
  zombies: ZombieType[];
  userInput: string;
}
