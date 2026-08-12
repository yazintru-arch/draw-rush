import { motion } from 'framer-motion';
import { CheckCircle2, Eye, Lightbulb, Send, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getVisibleSecretUrl } from '../../lib/gameApi';
import { useGame } from '../../store/gameStore';
import { GlassPanel } from '../ui/GlassPanel';
import { NeonButton } from '../ui/NeonButton';
import { Timer } from '../ui/Timer';

export function GuessingScreen() {
  const { state, makeGuess, judgePendingGuess } = useGame();
  const [guess, setGuess] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const server = state.server;

  useEffect(() => {
    let active = true;
    const objectPath = server?.visibleSecret?.objectPath;
    setImageUrl(null);
    setImageError(null);
    if (!objectPath) return () => { active = false; };

    const loadSignedUrl = () => {
      void getVisibleSecretUrl(objectPath)
        .then((url) => { if (active) setImageUrl(url); })
        .catch(() => { if (active) setImageError('تعذر تحميل الصورة المخصصة للخصم.'); });
    };

    loadSignedUrl();
    // Signed URLs are deliberately short-lived. Refresh before their 55-second
    // expiry so the protected image remains available throughout both turns.
    const renewal = window.setInterval(loadSignedUrl, 45_000);

    return () => { active = false; window.clearInterval(renewal); };
  }, [server?.visibleSecret?.objectPath]);

  if (!server) return null;

  const self = server.players.find((player) => player.isSelf);
  const activePlayer = server.players.find((player) => player.isCurrentTurn);
  const isMyTurn = self?.isCurrentTurn === true;
  const pendingToJudge = server.guesses.filter((item) => !item.isMine && item.status === 'pending');
  const myGuesses = server.guesses.filter((item) => item.isMine);

  const submit = async () => {
    const text = guess.trim();
    if (!text || !isMyTurn || state.isLoading) return;
    try {
      await makeGuess(text);
      setGuess('');
    } catch {
      // The provider shows the server error. It never reveals answer validity.
    }
  };

  const judge = async (guessId: string, correct: boolean) => {
    if (state.isLoading) return;
    try {
      await judgePendingGuess(guessId, correct);
    } catch {
      // A duplicate judge attempt is rejected atomically by the server.
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-6">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3"><Eye className="w-6 h-6 text-game-cyan" /><div><h2 className="text-2xl font-black">صورة خصمك السرية</h2><p className="text-sm text-white/50">الأسئلة والتواصل عبر Discord</p></div></div>
          <div className="flex items-center gap-4"><div className="text-left"><p className="text-xs text-white/50">الدور الحالي</p><p className="font-bold text-game-cyan">{activePlayer?.name ?? '—'}</p></div><Timer duration={60} size="md" showLabel={false} /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <GlassPanel className="p-4 min-h-64 flex items-center justify-center overflow-hidden">
            {imageUrl ? <img src={imageUrl} alt="الصورة السرية للخصم" className="max-h-[450px] w-full object-contain rounded-xl" /> : <div className="text-center text-white/40">{imageError ?? 'جارٍ تحميل الصورة…'}</div>}
          </GlassPanel>
        </motion.div>

        {isMyTurn ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassPanel glow="cyan" className="p-6">
              <div className="flex items-center gap-2 mb-4"><Lightbulb className="w-5 h-5 text-game-cyan" /><span className="font-bold">اكتب تخمينك</span></div>
              <div className="flex gap-3">
                <input type="text" value={guess} onChange={(event) => setGuess(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void submit(); }} placeholder="ما هذه الصورة؟" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-game-cyan/50 focus:ring-2 focus:ring-game-cyan/20 placeholder:text-white/20 transition-all" maxLength={120} autoFocus />
                <NeonButton variant="cyan" onClick={() => { void submit(); }} disabled={!guess.trim() || state.isLoading}><Send className="w-5 h-5" /></NeonButton>
              </div>
              <p className="text-xs text-white/30 mt-3 text-right">التخمين يبقى قيد المراجعة حتى يحكم الخصم — لا توجد إجابة تلقائية.</p>
            </GlassPanel>
          </motion.div>
        ) : (
          <GlassPanel className="p-5 text-center text-white/60">انتظر دورك. يبقى الدور الحالي فعالًا حتى انتهاء الستين ثانية.</GlassPanel>
        )}

        {pendingToJudge.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="font-bold text-white/70">تخمينات الخصم التي تنتظر حكمك</h3>
            {pendingToJudge.map((item) => (
              <GlassPanel key={item.id} className="p-4 flex flex-wrap items-center gap-3">
                <span className="flex-1 font-bold">{item.text}</span>
                <NeonButton size="sm" variant="cyan" disabled={state.isLoading} onClick={() => { void judge(item.id, true); }} icon={<CheckCircle2 className="w-4 h-4" />}>صحيحة</NeonButton>
                <NeonButton size="sm" variant="outline" disabled={state.isLoading} onClick={() => { void judge(item.id, false); }} icon={<XCircle className="w-4 h-4" />}>خاطئة</NeonButton>
              </GlassPanel>
            ))}
          </motion.div>
        )}

        {myGuesses.length > 0 && <GlassPanel className="p-4"><h3 className="font-bold text-white/70 mb-2">تخميناتك</h3><div className="space-y-2">{myGuesses.map((item) => <div key={item.id} className="flex items-center justify-between text-sm"><span>{item.text}</span><span className={item.status === 'correct' ? 'text-green-400' : item.status === 'incorrect' ? 'text-red-400' : 'text-white/40'}>{item.status === 'pending' ? 'قيد المراجعة' : item.status === 'correct' ? '+1' : '0'}</span></div>)}</div></GlassPanel>}
        {state.error && <p role="alert" className="text-center text-sm text-red-300">{state.error}</p>}
      </div>
    </div>
  );
}
