import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Shuffle, Sparkles } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { NeonButton } from '../ui/NeonButton';
import { useGame } from '../../store/gameStore';
import { mockPlayers } from '../../data/mock';

export function DrawerSelectionScreen() {
  const { state, dispatch } = useGame();
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [finalIndex, setFinalIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const players = state.room?.players || mockPlayers;
  const eligiblePlayers = players.filter(p => !p.hasBeenDrawer);

  const startSelection = () => {
    setIsSelecting(true);
    setShowResult(false);
    setFinalIndex(null);

    // Rapid cycling animation
    let count = 0;
    const maxCount = 30;
    const interval = setInterval(() => {
      setSelectedIndex(prev => (prev + 1) % eligiblePlayers.length);
      count++;
      if (count >= maxCount) {
        clearInterval(interval);
        const final = Math.floor(Math.random() * eligiblePlayers.length);
        setFinalIndex(final);
        setSelectedIndex(final);
        setIsSelecting(false);
        setTimeout(() => setShowResult(true), 500);
      }
    }, 100);
  };

  const proceed = () => {
    if (finalIndex !== null) {
      const drawer = eligiblePlayers[finalIndex];
      dispatch({ type: 'SET_DRAWER', playerId: drawer.id });
      dispatch({ type: 'SET_SCREEN', screen: 'word_submission' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20">
      <div className="max-w-4xl w-full flex flex-col items-center gap-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3 justify-center">
            <Shuffle className="w-8 h-8 text-game-purple" />
            اختيار الرسام
          </h2>
          <p className="text-white/50">سيتم اختيار رسام الجولة عشوائياً</p>
        </motion.div>

        {/* Players Circle */}
        <div className="relative w-full max-w-lg aspect-square">
          {/* Center glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={isSelecting ? { scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-32 h-32 rounded-full bg-game-purple/20 blur-2xl"
            />
          </div>

          {/* Players positioned in circle */}
          {eligiblePlayers.map((player, i) => {
            const angle = (i / eligiblePlayers.length) * 2 * Math.PI - Math.PI / 2;
            const radius = 40;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            const isSelected = i === selectedIndex;
            const isFinal = finalIndex === i && showResult;

            return (
              <motion.div
                key={player.id}
                className="absolute"
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                animate={isSelected ? { scale: 1.15, zIndex: 10 } : { scale: 1, zIndex: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className={`
                  relative transition-all duration-200
                  ${isSelected ? 'scale-110' : 'scale-100 opacity-60'}
                  ${isFinal ? 'scale-125' : ''}
                `}>
                  <div
                    className={`
                      w-20 h-20 rounded-full flex items-center justify-center text-3xl
                      transition-all duration-200
                      ${isSelected ? 'ring-4 ring-game-purple shadow-[0_0_30px_rgba(168,85,247,0.5)]' : 'ring-2 ring-white/10'}
                    `}
                    style={{
                      background: `linear-gradient(135deg, ${player.color}30, ${player.color}10)`,
                    }}
                  >
                    {player.avatar}
                  </div>
                  <div className={`
                    absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-bold
                    ${isSelected ? 'text-white' : 'text-white/40'}
                  `}>
                    {player.name}
                  </div>

                  {isFinal && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2"
                    >
                      <Sparkles className="w-6 h-6 text-yellow-400" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Result */}
        <AnimatePresence>
          {showResult && finalIndex !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="text-center"
            >
              <GlassPanel glow="purple" className="px-8 py-6">
                <div className="text-5xl mb-3">{eligiblePlayers[finalIndex].avatar}</div>
                <h3 className="text-2xl font-black text-game-purple neon-text-purple mb-1">
                  {eligiblePlayers[finalIndex].name}
                </h3>
                <p className="text-white/60">سيرسم في هذه الجولة!</p>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {!showResult ? (
            <NeonButton
              variant="purple"
              size="lg"
              onClick={startSelection}
              disabled={isSelecting}
              icon={<Shuffle className="w-5 h-5" />}
            >
              {isSelecting ? 'جاري الاختيار...' : 'اختر عشوائياً'}
            </NeonButton>
          ) : (
            <NeonButton
              variant="cyan"
              size="lg"
              onClick={proceed}
              icon={<Sparkles className="w-5 h-5" />}
            >
              استمرار
            </NeonButton>
          )}
        </motion.div>
      </div>
    </div>
  );
}
