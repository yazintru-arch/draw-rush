import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useGame } from '../../store/gameStore';

interface TimerProps {
  duration?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function Timer({ duration = 60, size = 'lg', showLabel = true }: TimerProps) {
  const { state } = useGame();
  const endsAt = state.server?.turn?.endsAt ?? null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return undefined;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [endsAt]);

  // Rendering is derived from the server-issued expiry timestamp. No client
  // action writes a remaining-time value back to the database.
  const timer = endsAt
    ? Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / 1000))
    : state.timer;

  const progress = (timer / duration) * 100;
  const isLow = timer <= 10;
  const isCritical = timer <= 5;

  const sizes = {
    sm: { width: 60, stroke: 4, font: 'text-lg' },
    md: { width: 100, stroke: 6, font: 'text-2xl' },
    lg: { width: 140, stroke: 8, font: 'text-4xl' },
  };

  const s = sizes[size];
  const radius = (s.width - s.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const color = isCritical ? '#ef4444' : isLow ? '#f59e0b' : '#06b6d4';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: s.width, height: s.width }}>
        <svg width={s.width} height={s.width} className="transform -rotate-90">
          <circle
            cx={s.width / 2}
            cy={s.width / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={s.stroke}
          />
          <motion.circle
            cx={s.width / 2}
            cy={s.width / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{
              filter: `drop-shadow(0 0 8px ${color}60)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className={`font-black ${s.font}`}
            style={{ color }}
            animate={isCritical ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
          >
            {timer}
          </motion.span>
        </div>
      </div>
      {showLabel && (
        <span className="text-sm text-white/60 font-medium">ثانية</span>
      )}
    </div>
  );
}
