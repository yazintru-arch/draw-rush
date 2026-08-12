import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  broadcastRoomChange,
  createRoom,
  ensureGuestSession,
  getGameState,
  judgeGuess,
  joinRoom,
  roomCodeFromLocation,
  setReady,
  startGame,
  submitGuess,
  subscribeToRoom,
} from '../lib/gameApi';
import type { GameState, GameScreen, Room, Round, Player, ServerGameState } from '../types';

type GameAction =
  | { type: 'SET_SCREEN'; screen: GameScreen }
  | { type: 'SET_ROOM'; room: Room }
  | { type: 'SET_CURRENT_PLAYER'; player: Player }
  | { type: 'SET_CURRENT_ROUND'; round: Round }
  | { type: 'SET_DRAWING_INDEX'; index: number }
  | { type: 'SET_GUESS_INDEX'; index: number }
  | { type: 'SET_TIMER'; timer: number }
  | { type: 'START_TIMER' }
  | { type: 'STOP_TIMER' }
  | { type: 'TICK_TIMER' }
  | { type: 'UPDATE_PLAYER_READY'; playerId: string; ready: boolean }
  | { type: 'SET_DRAWER'; playerId: string }
  | { type: 'ADD_PROMPT'; prompt: { id: string; text: string; authorId: string; authorName: string } }
  | { type: 'ADD_DRAWING'; drawing: { id: string; promptId: string; promptText: string; imageData: string } }
  | { type: 'ADD_GUESS'; guess: { playerId: string; guessedPromptId: string; guessedText: string } }
  | { type: 'NEXT_ROUND' }
  | { type: 'SET_SERVER_STATE'; server: ServerGameState }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET_GAME' };

const playerColors = ['#a855f7', '#06b6d4'];
const playerAvatars = ['🎨', '⚡'];

const initialState: GameState = {
  screen: 'home',
  room: null,
  currentPlayer: null,
  currentRound: null,
  currentDrawingIndex: 0,
  currentGuessIndex: 0,
  timer: 60,
  isTimerRunning: false,
  server: null,
  isLoading: true,
  error: null,
};

function screenForServerState(server: ServerGameState): GameScreen {
  if (server.room.status === 'waiting') return 'lobby';
  if (server.room.status === 'playing') return 'guessing';
  return 'final_results';
}

function legacyRoomFromServer(server: ServerGameState): Room {
  const players: Player[] = server.players.map((player, index) => ({
    id: player.id,
    name: player.name,
    avatar: playerAvatars[index] ?? '👤',
    color: playerColors[index] ?? '#a855f7',
    score: player.score,
    isReady: player.isReady,
    isDrawer: player.isCurrentTurn,
    hasBeenDrawer: server.turn?.ordinal === 2 && player.isCurrentTurn,
  }));

  return {
    id: server.room.id,
    code: server.room.code,
    players,
    currentRound: server.turn?.ordinal ?? 2,
    totalRounds: 2,
    rounds: [],
    status: server.room.status,
    hostId: server.room.isHost ? (players.find((player) => player.name)?.id ?? '') : '',
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_SERVER_STATE': {
      const room = legacyRoomFromServer(action.server);
      const currentPlayer = room.players.find((player) => action.server.players.some((serverPlayer) => serverPlayer.id === player.id && serverPlayer.isSelf)) ?? null;
      const currentRound: Round | null = action.server.turn
        ? {
            id: action.server.turn.id,
            roundNumber: action.server.turn.ordinal,
            drawerId: action.server.turn.playerId,
            drawerName: room.players.find((player) => player.id === action.server.turn?.playerId)?.name ?? '',
            prompts: [],
            drawings: [],
            guesses: [],
            scores: Object.fromEntries(room.players.map((player) => [player.id, player.score])),
            status: action.server.room.status === 'playing' ? 'guessing' : 'finished',
          }
        : null;

      return {
        ...state,
        server: action.server,
        room,
        currentPlayer,
        currentRound,
        timer: action.server.turn?.remainingSeconds ?? 0,
        isTimerRunning: action.server.room.status === 'playing',
        screen: screenForServerState(action.server),
        isLoading: false,
        error: null,
      };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false };
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };
    case 'SET_ROOM':
      return { ...state, room: action.room };
    case 'SET_CURRENT_PLAYER':
      return { ...state, currentPlayer: action.player };
    case 'SET_CURRENT_ROUND':
      return { ...state, currentRound: action.round };
    case 'SET_DRAWING_INDEX':
      return { ...state, currentDrawingIndex: action.index };
    case 'SET_GUESS_INDEX':
      return { ...state, currentGuessIndex: action.index };
    // The active timer is derived from the server's `ends_at`, never mutated
    // by a browser action. These legacy actions remain only for dormant visual
    // components that are not used by the secure game route.
    case 'SET_TIMER':
    case 'START_TIMER':
    case 'STOP_TIMER':
    case 'TICK_TIMER':
      return state;
    case 'UPDATE_PLAYER_READY': {
      if (!state.room || state.server) return state;
      return {
        ...state,
        room: {
          ...state.room,
          players: state.room.players.map((player) => player.id === action.playerId ? { ...player, isReady: action.ready } : player),
        },
      };
    }
    case 'SET_DRAWER': {
      if (!state.room || !state.currentRound || state.server) return state;
      const players = state.room.players.map((player) => player.id === action.playerId
        ? { ...player, isDrawer: true, hasBeenDrawer: true }
        : { ...player, isDrawer: false });
      return {
        ...state,
        room: { ...state.room, players },
        currentRound: { ...state.currentRound, drawerId: action.playerId, drawerName: players.find((player) => player.id === action.playerId)?.name ?? '' },
      };
    }
    case 'ADD_PROMPT':
    case 'ADD_DRAWING':
    case 'ADD_GUESS':
    case 'NEXT_ROUND':
      return state;
    case 'RESET_GAME':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  createSecureRoom: () => Promise<void>;
  toggleReady: () => Promise<void>;
  beginGame: () => Promise<void>;
  makeGuess: (text: string) => Promise<void>;
  judgePendingGuess: (guessId: string, correct: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const bootstrapped = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const apply = useCallback((server: ServerGameState) => {
    dispatch({ type: 'SET_SERVER_STATE', server });
  }, []);

  const refresh = useCallback(async () => {
    const roomCode = stateRef.current.server?.room.code ?? roomCodeFromLocation();
    if (!roomCode) return;
    try {
      apply(await getGameState(roomCode));
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: error instanceof Error ? error.message : 'تعذر تحديث حالة اللعبة.' });
    }
  }, [apply]);

  const notifyAndRefresh = useCallback(async (operation: () => Promise<ServerGameState | void>) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const result = await operation();
      if (result) apply(result);
      else await refresh();
      await broadcastRoomChange(channelRef.current);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: error instanceof Error ? error.message : 'تعذر إكمال العملية.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, [apply, refresh]);

  const createSecureRoom = useCallback(async () => {
    await notifyAndRefresh(createRoom);
  }, [notifyAndRefresh]);

  const toggleReady = useCallback(async () => {
    const server = stateRef.current.server;
    const self = server?.players.find((player) => player.isSelf);
    if (!server || !self) return;
    await notifyAndRefresh(() => setReady(server.room.code, !self.isReady));
  }, [notifyAndRefresh]);

  const beginGame = useCallback(async () => {
    const roomCode = stateRef.current.server?.room.code;
    if (!roomCode) return;
    await notifyAndRefresh(() => startGame(roomCode));
  }, [notifyAndRefresh]);

  const makeGuess = useCallback(async (text: string) => {
    const roomCode = stateRef.current.server?.room.code;
    if (!roomCode) return;
    await notifyAndRefresh(() => submitGuess(roomCode, text));
  }, [notifyAndRefresh]);

  const judgePendingGuess = useCallback(async (guessId: string, correct: boolean) => {
    await notifyAndRefresh(() => judgeGuess(guessId, correct));
  }, [notifyAndRefresh]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const bootstrap = async () => {
      dispatch({ type: 'SET_LOADING', loading: true });
      try {
        await ensureGuestSession();
        const roomCode = roomCodeFromLocation();
        if (roomCode) {
          try {
            apply(await getGameState(roomCode));
          } catch {
            // A room invite is intentionally join-once. `join_room` is
            // idempotent for the current auth.uid() and atomically enforces 2 players.
            apply(await joinRoom(roomCode));
          }
        } else {
          dispatch({ type: 'SET_LOADING', loading: false });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', error: error instanceof Error ? error.message : 'تعذر بدء جلسة الضيف.' });
      }
    };

    void bootstrap();
  }, [apply]);

  useEffect(() => {
    const roomCode = state.server?.room.code;
    if (!roomCode) return undefined;

    const channel = subscribeToRoom(roomCode, () => { void refresh(); });
    channelRef.current = channel;
    // Polling is only a liveness fallback for dropped websocket connections and
    // causes the database to expire a turn using clock_timestamp(). It never
    // sends a timer value from the browser.
    const poll = window.setInterval(() => { void refresh(); }, 1500);

    return () => {
      window.clearInterval(poll);
      channelRef.current = null;
      channel.unsubscribe();
    };
  }, [refresh, state.server?.room.code]);

  const value = useMemo<GameContextType>(() => ({
    state,
    dispatch,
    createSecureRoom,
    toggleReady,
    beginGame,
    makeGuess,
    judgePendingGuess,
    refresh,
  }), [beginGame, createSecureRoom, judgePendingGuess, makeGuess, refresh, state, toggleReady]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
