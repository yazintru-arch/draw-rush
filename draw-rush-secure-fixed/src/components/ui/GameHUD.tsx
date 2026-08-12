import { motion } from 'framer-motion';
import { Users, Trophy, Hash } from 'lucide-react';
import { useGame } from '../../store/gameStore';

export function GameHUD() {
  const { state } = useGame();
  const room = state.room;
  const round = state.currentRound;

  if (!room) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
    >
      <div className="max-w-6xl mx-auto glass-panel px-6 py-3 flex items-center justify-between">
        {/* Logo / Room */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-game-purple" />
            <span className="text-sm font-bold text-game-purple neon-text-purple">
              {room.code}
            </span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-game-cyan" />
            <span className="text-sm text-white/70">
              {room.players.length}/2
            </span>
          </div>
        </div>

        {/* Round Info */}
        {round && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/50">الجولة</span>
            <span className="text-lg font-black text-game-cyan neon-text-cyan">
              {round.roundNumber}
            </span>
            <span className="text-sm text-white/30">/ {room.totalRounds}</span>
          </div>
        )}

        {/* Score */}
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-bold text-yellow-400">
            {state.currentPlayer?.score || 0}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
