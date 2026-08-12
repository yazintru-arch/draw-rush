import { motion } from 'framer-motion';
import { Trophy, Crown, Star, RotateCcw, Home } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { NeonButton } from '../ui/NeonButton';
import { useGame } from '../../store/gameStore';
import { mockPlayers } from '../../data/mock';

export function FinalResultsScreen() {
  const { state, dispatch } = useGame();
  const players = state.room?.players || mockPlayers;

  // Sort by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const topThree = sortedPlayers.slice(0, 3);

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
    dispatch({ type: 'SET_SCREEN', screen: 'home' });
  };

  const goHome = () => {
    dispatch({ type: 'RESET_GAME' });
    dispatch({ type: 'SET_SCREEN', screen: 'home' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-8">
      <div className="max-w-4xl w-full flex flex-col items-center gap-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black mb-2 gradient-text">الفائز!</h2>
          <p className="text-xl text-white/60">انتهت اللعبة</p>
        </motion.div>

        {/* Winner showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
          className="relative"
        >
          {/* Glow effect */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-game-purple/30 blur-3xl rounded-full"
          />

          <GlassPanel glow="purple" className="relative px-12 py-10 text-center">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
              className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl"
              style={{
                background: `linear-gradient(135deg, ${winner.color}40, ${winner.color}20)`,
                border: `3px solid ${winner.color}`,
                boxShadow: `0 0 40px ${winner.color}50`,
              }}
            >
              {winner.avatar}
            </motion.div>

            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-3xl font-black text-game-purple neon-text-purple mb-2"
            >
              {winner.name}
            </motion.h3>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-2"
            >
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-black text-yellow-400">{winner.score}</span>
              <span className="text-white/50">نقطة</span>
            </motion.div>
          </GlassPanel>
        </motion.div>

        {/* Top 3 podium */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full"
        >
          <h3 className="text-lg font-bold text-white/70 text-center mb-4">أفضل 3 لاعبين</h3>
          <div className="flex items-end justify-center gap-4">
            {topThree.map((player, i) => {
              const heights = ['h-24', 'h-36', 'h-20'];
              const positions = [1, 0, 2]; // 2nd, 1st, 3rd
              const pos = positions[i];
              const medals = ['🥈', '🥇', '🥉'];

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-2xl mb-2">{medals[pos]}</div>
                  <div
                    className={`w-20 ${heights[pos]} rounded-t-xl flex items-center justify-center`}
                    style={{
                      background: `linear-gradient(to top, ${player.color}30, ${player.color}10)`,
                      border: `2px solid ${player.color}50`,
                      borderBottom: 'none',
                    }}
                  >
                    <span className="text-2xl">{player.avatar}</span>
                  </div>
                  <div className="mt-2 text-center">
                    <div className="font-bold text-sm">{player.name}</div>
                    <div className="text-xs text-white/50">{player.score} نقطة</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Full leaderboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full"
        >
          <h3 className="text-lg font-bold text-white/70 mb-3">الترتيب النهائي</h3>
          <div className="space-y-2">
            {sortedPlayers.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.05 }}
              >
                <GlassPanel className="p-3 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                    i === 0 ? 'bg-yellow-400/20 text-yellow-400' :
                    i === 1 ? 'bg-gray-400/20 text-gray-300' :
                    i === 2 ? 'bg-orange-400/20 text-orange-400' :
                    'bg-white/5 text-white/40'
                  }`}>
                    {i + 1}
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${player.color}30, ${player.color}10)`,
                      border: `2px solid ${player.color}40`,
                    }}
                  >
                    {player.avatar}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold">{player.name}</span>
                  </div>
                  <div className="font-black text-game-cyan">{player.score}</div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-4"
        >
          <NeonButton variant="outline" onClick={goHome} icon={<Home className="w-5 h-5" />}>
            الصفحة الرئيسية
          </NeonButton>
          <NeonButton variant="purple" onClick={resetGame} icon={<RotateCcw className="w-5 h-5" />}>
            لعبة جديدة
          </NeonButton>
        </motion.div>
      </div>
    </div>
  );
}
