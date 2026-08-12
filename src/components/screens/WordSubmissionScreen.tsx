import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Send, PenTool, CheckCircle2, Clock } from 'lucide-react';
import { NeonButton } from '../ui/NeonButton';
import { GlassPanel } from '../ui/GlassPanel';
import { PlayerCard } from '../ui/PlayerCard';
import { useGame } from '../../store/gameStore';
import { mockPrompts } from '../../data/mock';

export function WordSubmissionScreen() {
  const { state, dispatch } = useGame();
  const [word, setWord] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submissions, setSubmissions] = useState<typeof mockPrompts>([]);

  const room = state.room;
  const drawer = room?.players.find(p => p.isDrawer);
  const isDrawer = state.currentPlayer?.id === drawer?.id;
  const otherPlayers = room?.players.filter(p => p.id !== drawer?.id) || [];

  const handleSubmit = () => {
    if (!word.trim()) return;
    const newPrompt = {
      id: `prompt-${Date.now()}`,
      text: word.trim(),
      authorId: state.currentPlayer?.id || '',
      authorName: state.currentPlayer?.name || '',
    };
    setSubmissions(prev => [...prev, newPrompt]);
    dispatch({ type: 'ADD_PROMPT', prompt: newPrompt });
    setSubmitted(true);
    setWord('');
  };

  // Simulate other players submitting
  const simulateOthers = () => {
    const mockWords = ['جبل', 'سيارة', 'طائرة', 'أسد', 'بيتزا', 'صاروخ', 'ملعب'];
    const newSubs = otherPlayers.slice(0, 7).map((p, i) => ({
      id: `prompt-mock-${i}`,
      text: mockWords[i],
      authorId: p.id,
      authorName: p.name,
    }));
    setSubmissions(newSubs);
    newSubs.forEach(p => dispatch({ type: 'ADD_PROMPT', prompt: p }));
  };

  const proceed = () => {
    dispatch({ type: 'SET_SCREEN', screen: 'drawing' });
    dispatch({ type: 'SET_TIMER', timer: 60 });
    dispatch({ type: 'START_TIMER' });
  };

  const allSubmitted = submissions.length >= 7;

  if (isDrawer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20">
        <div className="max-w-2xl w-full flex flex-col items-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <PenTool className="w-12 h-12 text-game-cyan mx-auto mb-4" />
            <h2 className="text-3xl font-black mb-2">أنت الرسام!</h2>
            <p className="text-white/50">انتظر حتى يكتب اللاعبون كلماتهم</p>
          </motion.div>

          <GlassPanel className="w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-white/60">الكلمات المستلمة</span>
              <span className="text-sm font-bold text-game-cyan">{submissions.length}/7</span>
            </div>
            <div className="space-y-2">
              {submissions.map((prompt, i) => (
                <motion.div
                  key={prompt.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="font-bold">{prompt.text}</span>
                  <span className="text-sm text-white/40 mr-auto">{prompt.authorName}</span>
                </motion.div>
              ))}
              {Array.from({ length: 7 - submissions.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <Clock className="w-5 h-5 text-white/20 flex-shrink-0" />
                  <span className="text-white/20">في الانتظار...</span>
                </div>
              ))}
            </div>
          </GlassPanel>

          <div className="flex gap-3">
            <NeonButton variant="outline" onClick={simulateOthers} disabled={allSubmitted}>
              محاكاة اللاعبين (تجريبي)
            </NeonButton>
            <NeonButton variant="cyan" onClick={proceed} disabled={!allSubmitted}>
              ابدأ الرسم
            </NeonButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20">
      <div className="max-w-xl w-full flex flex-col items-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-3xl font-black mb-2">اكتب كلمة</h2>
          <p className="text-white/50">
            الرسام هو <span className="text-game-cyan font-bold">{drawer?.name}</span>
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full"
            >
              <GlassPanel glow="purple" className="p-6">
                <label className="block text-sm text-white/60 mb-3">
                  اكتب كلمة أو عبارة قصيرة للرسام
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="مثال: جبل، سيارة، طائرة..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-right
                             focus:outline-none focus:border-game-purple/50 focus:ring-2 focus:ring-game-purple/20
                             placeholder:text-white/20 transition-all"
                    maxLength={30}
                    autoFocus
                  />
                  <NeonButton variant="purple" onClick={handleSubmit} disabled={!word.trim()}>
                    <Send className="w-5 h-5" />
                  </NeonButton>
                </div>
                <p className="text-xs text-white/30 mt-3 text-right">
                  {word.length}/30 حرف
                </p>
              </GlassPanel>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <GlassPanel glow="cyan" className="p-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black mb-2">تم الإرسال!</h3>
                <p className="text-white/60">انتظر بقية اللاعبين...</p>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Other players status */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2">
          {otherPlayers.map((player, i) => (
            <PlayerCard
              key={player.id}
              player={{ ...player, isReady: submissions.some(s => s.authorId === player.id) }}
              index={i}
              size="sm"
              showStatus
            />
          ))}
        </div>
      </div>
    </div>
  );
}
