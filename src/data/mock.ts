import type { Player, Room, Round, Prompt, Drawing, Guess } from '../types';

const playerColors = [
  '#a855f7', '#06b6d4', '#ec4899', '#22c55e',
  '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6',
];

const avatarEmojis = ['🎨', '🚀', '🦁', '🍕', '⚽', '✈️', '🚗', '⛰️'];

export const mockPlayers: Player[] = Array.from({ length: 8 }, (_, i) => ({
  id: `player-${i + 1}`,
  name: ['أحمد', 'سارة', 'محمد', 'فاطمة', 'علي', 'نور', 'يوسف', 'ليلى'][i],
  avatar: avatarEmojis[i],
  color: playerColors[i],
  score: 0,
  isReady: i < 6,
  isDrawer: false,
  hasBeenDrawer: false,
}));

export const mockPrompts: Prompt[] = [
  { id: 'prompt-1', text: 'جبل', authorId: 'player-2', authorName: 'سارة' },
  { id: 'prompt-2', text: 'سيارة', authorId: 'player-3', authorName: 'محمد' },
  { id: 'prompt-3', text: 'طائرة', authorId: 'player-4', authorName: 'فاطمة' },
  { id: 'prompt-4', text: 'أسد', authorId: 'player-5', authorName: 'علي' },
  { id: 'prompt-5', text: 'بيتزا', authorId: 'player-6', authorName: 'نور' },
  { id: 'prompt-6', text: 'صاروخ', authorId: 'player-7', authorName: 'يوسف' },
  { id: 'prompt-7', text: 'ملعب', authorId: 'player-8', authorName: 'ليلى' },
];

export const mockDrawings: Drawing[] = mockPrompts.map((prompt, i) => ({
  id: `drawing-${i + 1}`,
  promptId: prompt.id,
  promptText: prompt.text,
  drawerId: 'player-1',
  drawerName: 'أحمد',
  imageData: '',
  timeSpent: 45 + i * 3,
}));

export const mockGuesses: Guess[] = [
  { playerId: 'player-2', playerName: 'سارة', drawingId: 'drawing-1', guessedPromptId: 'prompt-1', guessedText: 'جبل', isCorrect: true, points: 100 },
  { playerId: 'player-3', playerName: 'محمد', drawingId: 'drawing-2', guessedPromptId: 'prompt-3', guessedText: 'طائرة', isCorrect: false, points: 0 },
  { playerId: 'player-4', playerName: 'فاطمة', drawingId: 'drawing-3', guessedPromptId: 'prompt-3', guessedText: 'طائرة', isCorrect: true, points: 100 },
  { playerId: 'player-5', playerName: 'علي', drawingId: 'drawing-4', guessedPromptId: 'prompt-4', guessedText: 'أسد', isCorrect: true, points: 100 },
  { playerId: 'player-6', playerName: 'نور', drawingId: 'drawing-5', guessedPromptId: 'prompt-5', guessedText: 'بيتزا', isCorrect: true, points: 100 },
  { playerId: 'player-7', playerName: 'يوسف', drawingId: 'drawing-6', guessedPromptId: 'prompt-6', guessedText: 'صاروخ', isCorrect: true, points: 100 },
  { playerId: 'player-8', playerName: 'ليلى', drawingId: 'drawing-7', guessedPromptId: 'prompt-2', guessedText: 'سيارة', isCorrect: false, points: 0 },
];

export const mockRound: Round = {
  id: 'round-1',
  roundNumber: 1,
  drawerId: 'player-1',
  drawerName: 'أحمد',
  prompts: mockPrompts,
  drawings: mockDrawings,
  guesses: mockGuesses,
  scores: {
    'player-1': 350,
    'player-2': 100,
    'player-3': 0,
    'player-4': 100,
    'player-5': 100,
    'player-6': 100,
    'player-7': 100,
    'player-8': 0,
  },
  status: 'results',
};

export const mockRoom: Room = {
  id: 'room-1',
  code: 'DRAW88',
  players: mockPlayers,
  currentRound: 1,
  totalRounds: 8,
  rounds: [mockRound],
  status: 'playing',
  hostId: 'player-1',
};

export const createMockRoom = (): Room => ({
  ...mockRoom,
  players: mockPlayers.map(p => ({ ...p, score: Math.floor(Math.random() * 500) })),
});
