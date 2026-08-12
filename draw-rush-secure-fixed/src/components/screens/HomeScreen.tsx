import { motion } from 'framer-motion';
import { Paintbrush, Users, Zap, Gamepad2 } from 'lucide-react';
import { NeonButton } from '../ui/NeonButton';
import { GlassPanel } from '../ui/GlassPanel';
import { useGame } from '../../store/gameStore';

export function HomeScreen() {
  const { createSecureRoom, state } = useGame();

  const handleStart = () => {
    void createSecureRoom().catch(() => undefined);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }} className="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] rounded-full border border-game-purple/10" />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 90, repeat: Infinity, ease: 'linear' }} className="absolute -bottom-1/2 -left-1/2 w-[600px] h-[600px] rounded-full border border-game-cyan/10" />
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-game-purple/40 animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-game-cyan/30 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 rounded-full bg-game-pink/40 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-2xl w-full">
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}><Paintbrush className="w-10 h-10 text-game-purple" /></motion.div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight"><span className="gradient-text">DRAW</span><span className="text-white"> RUSH</span></h1>
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}><Zap className="w-10 h-10 text-game-cyan" /></motion.div>
          </div>
          <p className="text-xl text-white/60 font-medium">تحدّي تخمين آمن بين لاعبين</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="grid grid-cols-3 gap-4 w-full">
          {[
            { icon: Users, label: 'لاعبان', desc: 'تحدٍّ 1 ضد 1' },
            { icon: Paintbrush, label: 'صورة سرية', desc: 'ترى صورة خصمك فقط' },
            { icon: Gamepad2, label: '60 ثانية', desc: 'للتخمين عبر Discord' },
          ].map((feature, index) => (
            <GlassPanel key={index} className="p-4 text-center" animate={false}>
              <feature.icon className="w-6 h-6 text-game-purple mx-auto mb-2" />
              <div className="font-bold text-sm">{feature.label}</div>
              <div className="text-xs text-white/50">{feature.desc}</div>
            </GlassPanel>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="flex flex-col items-center gap-4">
          <NeonButton variant="purple" size="lg" onClick={handleStart} disabled={state.isLoading || state.authStatus !== 'authenticated'} icon={<Gamepad2 className="w-5 h-5" />}>
            {state.authStatus === 'initializing' ? 'جارٍ تهيئة جلسة الضيف...' : state.isLoading ? 'جارٍ التحضير...' : 'ابدأ اللعبة'}
          </NeonButton>
          <p className="text-sm text-white/40">أنشئ غرفة ثم شارك رابط الدعوة مع خصمك</p>
          {state.error && <p role="alert" className="max-w-md text-center text-sm text-red-300">{state.error}</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center gap-6 text-3xl opacity-30">
          {['🎨', '⚡', '🖼️', '💬'].map((emoji, index) => <motion.span key={index} animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, delay: index * 0.3, ease: 'easeInOut' }}>{emoji}</motion.span>)}
        </motion.div>
      </div>
    </div>
  );
}
