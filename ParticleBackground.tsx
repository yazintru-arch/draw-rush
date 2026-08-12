import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Shuffle, Image, Sparkles } from 'lucide-react';
import { useGame } from '../../store/gameStore';
import { mockDrawings } from '../../data/mock';

export function ShuffleScreen() {
  const { dispatch } = useGame();
  const drawings = mockDrawings;

  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count >= 20) {
        clearInterval(interval);
      }
    }, 150);

    const timeout = setTimeout(() => {
      dispatch({ type: 'SET_SCREEN', screen: 'guessing' });
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [dispatch]);

  const shuffledDrawings = [...drawings].sort(() => Math.random() - 0.5);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-4xl w-full flex flex-col items-center gap-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block mb-4"
          >
            <Shuffle className="w-12 h-12 text-game-purple" />
          </motion.div>
          <h2 className="text-3xl font-black mb-2">خلط الرسومات</h2>
          <p className="text-white/50">يتم توزيع الرسومات عشوائياً على اللاعبين</p>
        </motion.div>

        {/* Cards shuffle animation */}
        <div className="relative w-full max-w-2xl h-64">
          {shuffledDrawings.slice(0, 5).map((drawing, i) => {
            const offset = (i - 2) * 30;
            const rotation = (i - 2) * 5;

            return (
              <motion.div
                key={drawing.id}
                className="absolute left-1/2 top-1/2 w-32 h-40 rounded-xl glass-panel flex items-center justify-center"
                style={{
                  marginLeft: '-64px',
                  marginTop: '-80px',
                }}
                animate={{
                  x: [offset, -offset, offset],
                  rotate: [rotation, -rotation, rotation],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
              >
                <Image className="w-8 h-8 text-white/20" />
              </motion.div>
            );
          })}

          {/* Center glow */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-game-purple/30 blur-3xl"
          />
        </div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-game-purple to-game-cyan"
            />
          </div>
          <p className="text-center text-sm text-white/40 mt-3">
            جاري التحضير...
          </p>
        </motion.div>

        {/* Sparkle effects */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            <Sparkles className="w-4 h-4 text-game-cyan" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
