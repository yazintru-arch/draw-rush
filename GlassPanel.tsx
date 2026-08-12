import { motion } from 'framer-motion';
import { Play, Copy, Check, Crown, UserPlus } from 'lucide-react';
import { NeonButton } from '../ui/NeonButton';
import { PlayerCard } from '../ui/PlayerCard';
import { GlassPanel } from '../ui/GlassPanel';
import { useGame } from '../../store/gameStore';
import { useState } from 'react';

export function LobbyScreen() {
  const { state, toggleReady, beginGame } = useGame();
  const [copied, setCopied] = useState(false);
  const room = state.room;
  const server = state.server;

  if (!room || !server) return null;

  const readyCount = server.players.filter((player) => player.isReady).length;
  const allReady = server.players.length === 2 && readyCount === 2;
  const self = server.players.find((player) => player.isSelf);

  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-8">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h2 className="text-3xl font-black mb-2">اللوبي</h2>
          <p className="text-white/50">انتظر الخصم ثم استعد لبدء التحدي</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="flex justify-center">
          <GlassPanel className="inline-flex items-center gap-4 px-6 py-3" glow="purple">
            <span className="text-white/50 text-sm">رابط الدعوة</span>
            <span className="text-2xl font-black text-game-purple neon-text-purple tracking-widest">{room.code}</span>
            <button onClick={copyInvite} aria-label="نسخ رابط الدعوة" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/50" />}
            </button>
          </GlassPanel>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-3 max-w-xl mx-auto w-full">
          {room.players.map((player, index) => <PlayerCard key={player.id} player={player} index={index} showStatus isCurrentPlayer={player.id === state.currentPlayer?.id} />)}
          {room.players.length < 2 && <GlassPanel className="p-5 text-center text-sm text-white/40">بانتظار الخصم…</GlassPanel>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <GlassPanel className="p-4">
            <div className="flex items-center justify-between mb-3"><span className="text-sm text-white/60">جاهزان للعبة</span><span className="text-sm font-bold text-game-cyan">{readyCount}/2</span></div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(readyCount / 2) * 100}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} className="h-full rounded-full bg-gradient-to-r from-game-purple to-game-cyan" /></div>
          </GlassPanel>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-center justify-center gap-4">
          <NeonButton variant={self?.isReady ? 'outline' : 'cyan'} disabled={!self || state.isLoading || state.authStatus !== 'authenticated'} onClick={() => { void toggleReady().catch(() => undefined); }} icon={self?.isReady ? <Check className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}>
            {self?.isReady ? 'إلغاء الجاهزية' : 'أنا جاهز!'}
          </NeonButton>
          <NeonButton variant="purple" disabled={!server.room.isHost || !allReady || state.isLoading || state.authStatus !== 'authenticated'} onClick={() => { void beginGame().catch(() => undefined); }} icon={<Play className="w-5 h-5" />}>
            ابدأ اللعبة
          </NeonButton>
        </motion.div>

        {server.room.isHost && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center"><span className="inline-flex items-center gap-2 text-sm text-yellow-400"><Crown className="w-4 h-4" />أنت مضيف الغرفة</span></motion.div>}
        {state.error && <p role="alert" className="text-center text-sm text-red-300">{state.error}</p>}
      </div>
    </div>
  );
}
