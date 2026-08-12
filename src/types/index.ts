export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: string;
  score: number;
  isReady: boolean;
  isDrawer: boolean;
  hasBeenDrawer: boolean;
}

export interface Prompt {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
}

export interface Drawing {
  id: string;
  promptId: string;
  promptText: string;
  drawerId: string;
  drawerName: string;
  imageData: string;
  timeSpent: number;
}

export interface Guess {
  playerId: string;
  playerName: string;
  drawingId: string;
  guessedPromptId: string;
  guessedText: string;
  isCorrect: boolean;
  points: number;
}

export interface Round {
  id: string;
  roundNumber: number;
  drawerId: string;
  drawerName: string;
  prompts: Prompt[];
  drawings: Drawing[];
  guesses: Guess[];
  scores: Record<string, number>;
  status: 'selecting_drawer' | 'submitting_words' | 'drawing' | 'shuffling' | 'guessing' | 'results' | 'finished';
}

export interface Room {
  id: string;
  code: string;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  rounds: Round[];
  status: 'waiting' | 'playing' | 'finished';
  hostId: string;
}

export type GameScreen = 
  | 'home' 
  | 'lobby' 
  | 'drawer_selection' 
  | 'word_submission' 
  | 'drawing' 
  | 'shuffle' 
  | 'guessing' 
  | 'round_results' 
  | 'final_results';

export interface GameState {
  screen: GameScreen;
  room: Room | null;
  currentPlayer: Player | null;
  currentRound: Round | null;
  currentDrawingIndex: number;
  currentGuessIndex: number;
  timer: number;
  isTimerRunning: boolean;
  server: ServerGameState | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * This is the only game shape accepted from Supabase.  It is deliberately a
 * sanitised view: a player never receives their own secret image, answers, or
 * a server-side guess validation result.
 */
export interface ServerPlayer {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
  isSelf: boolean;
  isCurrentTurn: boolean;
}

export interface ServerTurn {
  id: string;
  playerId: string;
  endsAt: string;
  remainingSeconds: number;
  ordinal: number;
}

export interface VisibleSecret {
  objectPath: string;
}

export interface ServerGuess {
  id: string;
  text: string;
  createdAt: string;
  status: 'pending' | 'correct' | 'incorrect';
  isMine: boolean;
  points: number;
}

export interface ServerGameState {
  room: {
    id: string;
    code: string;
    status: 'waiting' | 'playing' | 'finished';
    isHost: boolean;
  };
  players: ServerPlayer[];
  turn: ServerTurn | null;
  visibleSecret: VisibleSecret | null;
  guesses: ServerGuess[];
}
