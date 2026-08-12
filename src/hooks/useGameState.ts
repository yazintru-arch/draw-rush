import { useCallback, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useGame } from '../store/gameStore';
import type { GameScreen } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function useGameState() {
  const { state, dispatch } = useGame();

  const navigate = useCallback((screen: GameScreen) => {
    dispatch({ type: 'SET_SCREEN', screen });
  }, [dispatch]);

  const startTimer = useCallback(() => {
    dispatch({ type: 'START_TIMER' });
  }, [dispatch]);

  const stopTimer = useCallback(() => {
    dispatch({ type: 'STOP_TIMER' });
  }, [dispatch]);

  const resetTimer = useCallback((seconds: number) => {
    dispatch({ type: 'SET_TIMER', timer: seconds });
  }, [dispatch]);

  return {
    state,
    dispatch,
    navigate,
    startTimer,
    stopTimer,
    resetTimer,
  };
}

export function useTimerEffect(callback: () => void, deps: readonly unknown[] = []) {
  const { state } = useGame();

  useEffect(() => {
    if (state.timer === 0 && state.isTimerRunning) {
      callback();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.timer, state.isTimerRunning, ...deps]);
}
