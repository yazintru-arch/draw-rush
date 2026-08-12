import { motion } from 'framer-motion';
import { Trophy, CheckCircle2, XCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { NeonButton } from '../ui/NeonButton';
import { PlayerCard } from '../ui/PlayerCard';
import { ScoreBadge } from '../ui/ScoreBadge';
import { useGame } from '../../store/gameStore';
import { mockGuesses, mockDrawings, mockPrompts, mockPlayers } from '../../data/mock';

export function RoundResultsScreen() {
  const { state, dispatch } = useGame();
  const guesses = state.currentRound?.guesses || mockGuesses;
  const drawings = state.currentRound?.drawings || mockDrawings;
  const prompts = state.currentRound?.prompts || mockPrompts;
  const players = state.room?.players || mockPlayers;
  const round = state.currentRound;

  const correctGuesses = guesses.filter(g => g.isCorrect);
  const drawer = players.find(p => p.id === round?.drawerId);

  const nextRound = () => {
    if ((state.room?.currentRound || 1) >= 8) {
      dispatch({ type: 'SET_SCREEN', screen: 'final_results' });
    } else {
      dispatch({ type: 'NEXT_ROUND' });
      dispatch({ type: 'SET_SCREEN', screen: 'drawer_selection' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-8">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-3xl font-black mb-2">نتائج الجولة {round?.roundNumber}</h2>
          <p className="text-white/50">
            الرسام: <span className="text-game-cyan font-bold">{drawer?.name}</span>
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          <GlassPanel className="p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-black text-green-400">{correctGuesses.length}</div>
            <div className="text-sm text-white/50">تخمين صحيح</div>
          </GlassPanel>
          <GlassPanel className="p-4 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-black text-red-400">{guesses.length - correctGuesses.length}</div>
            <div className="text-sm text-white/50">تخمين خاطئ</div>
          </GlassPanel>
          <GlassPanel className="p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-black text-yellow-400">
              {correctGuesses.reduce((sum, g) => sum + g.points, 0)}
            </div>
            <div className="text-sm text-white/50">إجمالي النقاط</div>
          </GlassPanel>
        </motion.div>

        {/* Guess details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-bold text-white/70">تفاصيل التخمينات</h3>
          {guesses.map((guess, i) => {
            const drawing = drawings.find(d => d.id === guess.drawingId);
            const correctPrompt = prompts.find(p => p.id === drawing?.promptId);

            return (
              <motion.div
                key={guess.playerId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <GlassPanel className={`p-4 flex items-center gap-4 ${guess.isCorrect ? 'border-green-400/20' : 'border-red-400/20'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    guess.isCorrect ? 'bg-green-400/10' : 'bg-red-400/10'
                  }`}>
                    {guess.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{guess.playerName}</span>
                      <span className="text-white/30">خمن:</span>
                      <span className={`font-bold ${guess.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {guess.guessedText}
                      </span>
                    </div>
                    {!guess.isCorrect && correctPrompt && (
                      <div className="text-sm text-white/40 mt-1">
                        الإجابة الصحيحة: <span className="text-game-cyan">{correctPrompt.text}</span>
                      </div>
                    )}
                  </div>

                  <ScoreBadge score={guess.points} size="sm" />
                </GlassPanel>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Current scores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-bold text-white/70 mb-3">الترتيب الحالي</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {players
              .sort((a, b) => (round?.scores[b.id] || 0) - (round?.scores[a.id] || 0))
              .map((player, i) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                >
                  <PlayerCard
                    player={player}
                    index={i}
                    showScore
                    size="sm"
                  />
                </motion.div>
              ))}
          </div>
        </motion.div>

        {/* Next button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center"
        >
          <NeonButton
            variant="purple"
            size="lg"
            onClick={nextRound}
            icon={<ArrowLeft className="w-5 h-5" />}
          >
            {(state.room?.currentRound || 1) >= 8 ? 'النتائج النهائية' : 'الجولة التالية'}
          </NeonButton>
        </motion.div>
      </div>
    </div>
  );
}
