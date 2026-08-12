import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { Pencil, ChevronLeft, Image } from 'lucide-react';
import { DrawingCanvas } from '../drawing/DrawingCanvas';
import { Timer } from '../ui/Timer';
import { GlassPanel } from '../ui/GlassPanel';
import { NeonButton } from '../ui/NeonButton';
import { useGame } from '../../store/gameStore';
import { mockPrompts } from '../../data/mock';

export function DrawingScreen() {
  const { state, dispatch } = useGame();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedDrawings, setCompletedDrawings] = useState<string[]>([]);
  const [showPrompt, setShowPrompt] = useState(true);

  const prompts = state.currentRound?.prompts || mockPrompts;
  const currentPrompt = prompts[currentIndex];
  const isLast = currentIndex === prompts.length - 1;

  const handleSave = useCallback((dataUrl: string) => {
    setCompletedDrawings(prev => [...prev, dataUrl]);
    dispatch({
      type: 'ADD_DRAWING',
      drawing: {
        id: `drawing-${Date.now()}`,
        promptId: currentPrompt.id,
        promptText: currentPrompt.text,
        imageData: dataUrl,
      },
    });

    if (isLast) {
      dispatch({ type: 'STOP_TIMER' });
      dispatch({ type: 'SET_SCREEN', screen: 'shuffle' });
    } else {
      setCurrentIndex(prev => prev + 1);
      dispatch({ type: 'SET_TIMER', timer: 60 });
      setShowPrompt(true);
    }
  }, [currentPrompt, isLast, dispatch]);

  const skipPrompt = () => {
    if (isLast) {
      dispatch({ type: 'STOP_TIMER' });
      dispatch({ type: 'SET_SCREEN', screen: 'shuffle' });
    } else {
      setCurrentIndex(prev => prev + 1);
      dispatch({ type: 'SET_TIMER', timer: 60 });
      setShowPrompt(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-4 pt-24 pb-6">
      {/* HUD */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto w-full mb-4"
      >
        <div className="flex items-center justify-between">
          {/* Prompt info */}
          <div className="flex items-center gap-4">
            <GlassPanel className="px-4 py-2 flex items-center gap-3">
              <Pencil className="w-5 h-5 text-game-purple" />
              <div>
                <span className="text-xs text-white/50 block">الكلمة الحالية</span>
                <span className="text-xl font-black text-game-purple neon-text-purple">
                  {currentPrompt?.text}
                </span>
              </div>
            </GlassPanel>

            <div className="flex items-center gap-2 text-sm text-white/40">
              <span>{currentIndex + 1}</span>
              <span>/</span>
              <span>{prompts.length}</span>
            </div>
          </div>

          {/* Timer */}
          <Timer duration={60} size="md" />

          {/* Progress */}
          <div className="flex items-center gap-2">
            {prompts.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i < currentIndex ? 'bg-green-400' :
                  i === currentIndex ? 'bg-game-purple animate-pulse' :
                  'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Prompt reveal overlay */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-center"
              onClick={e => e.stopPropagation()}
            >
              <GlassPanel glow="purple" className="px-12 py-10 text-center">
                <span className="text-sm text-white/50 block mb-4">ارسم</span>
                <h2 className="text-6xl font-black gradient-text mb-6">
                  {currentPrompt?.text}
                </h2>
                <NeonButton variant="purple" onClick={() => setShowPrompt(false)}>
                  ابدأ الرسم
                </NeonButton>
              </GlassPanel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div className="flex-1 max-w-5xl mx-auto w-full">
        <DrawingCanvas
          width={900}
          height={550}
          onSave={handleSave}
        />
      </div>

      {/* Bottom controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-5xl mx-auto w-full mt-4 flex items-center justify-between"
      >
        <NeonButton variant="outline" size="sm" onClick={skipPrompt}>
          {isLast ? 'إنهاء' : 'تخطي'} <ChevronLeft className="w-4 h-4" />
        </NeonButton>

        <div className="flex items-center gap-2 text-sm text-white/40">
          <Image className="w-4 h-4" />
          <span>{completedDrawings.length} رسمة مكتملة</span>
        </div>
      </motion.div>
    </div>
  );
}
