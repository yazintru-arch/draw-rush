import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScoreBadgeProps {
  score: number;
  change?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, change = 0, size = 'md' }: ScoreBadgeProps) {
  const sizes = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-1.5 text-base',
    lg: 'px-4 py-2 text-lg',
  };

  const changeIcon = change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />;
  const changeColor = change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-white/40';

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 ${sizes[size]}`}
    >
      <span className="font-black text-game-cyan">{score}</span>
      {change !== 0 && (
        <span className={`flex items-center gap-1 text-xs ${changeColor}`}>
          {changeIcon}
          {Math.abs(change)}
        </span>
      )}
    </motion.div>
  );
}
