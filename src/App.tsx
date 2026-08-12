import { GameProvider, useGame } from './store/gameStore';
import type { ReactNode } from 'react';
import type { GameScreen } from './types';
import { ParticleBackground } from './components/ui/ParticleBackground';
import { GameHUD } from './components/ui/GameHUD';
import { ScreenTransition } from './components/animations/ScreenTransition';
import {
  HomeScreen,
  LobbyScreen,
  GuessingScreen,
  FinalResultsScreen,
} from './components/screens';

function GameRouter() {
  const { state } = useGame();

  const screens: Partial<Record<GameScreen, ReactNode>> = {
    home: <HomeScreen />,
    lobby: <LobbyScreen />,
    guessing: <GuessingScreen />,
    final_results: <FinalResultsScreen />,
  };

  return (
    <ScreenTransition screenKey={state.screen}>
      {screens[state.screen] ?? <HomeScreen />}
    </ScreenTransition>
  );
}

function App() {
  return (
    <GameProvider>
      <ParticleBackground />
      <GameHUD />
      <div className="relative z-10">
        <GameRouter />
      </div>
    </GameProvider>
  );
}

export default App;
