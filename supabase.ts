import { motion } from 'framer-motion';
import { Crown, Check, Pencil, Eye } from 'lucide-react';
import type { Player } from '../../types';
import { cn } from '../../hooks/useGameState';

interface PlayerCardProps {
  player: Player;
  index?: number;
  showScore?: boolean;
  showStatus?: boolean;
  isCurrentPlayer?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function PlayerCard({
  player,
  index = 0,
  showScore = false,
  showStatus = true,
  isCurrentPlayer = false,
  isSelected = false,
  onClick,
  size = 'md',
}: PlayerCardProps) {
  const sizes = {
    sm: 'p-3 gap-2',
    md: 'p-4 gap-3',
    lg: 'p-6 gap-4',
  };

  const avatarSizes = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
      whileHover={onClick ? { scale: 1.05, y: -4 } : {}}
      onClick={onClick}
      className={cn(
        'relative glass-panel rounded-xl flex items-center gap-3 transition-all duration-300',
        sizes[size],
        isSelected && 'neon-border-purple scale-105',
        isCurrentPlayer && 'ring-2 ring-game-cyan/50',
        onClick && 'cursor-pointer',
        player.isDrawer && 'neon-border-cyan'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'rounded-full flex items-center justify-center flex-shrink-0',
          avatarSizes[size]
        )}
        style={{
          background: `linear-gradient(135deg, ${player.color}40, ${player.color}20)`,
          border: `2px solid ${player.color}60`,
          boxShadow: `0 0 15px ${player.color}30`,
        }}
      >
        {player.avatar}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-bold truncate',
            size === 'sm' ? 'text-sm' : 'text-base'
          )}>
            {player.name}
          </span>
          {player.isDrawer && (
            <Pencil className="w-4 h-4 text-game-cyan flex-shrink-0" />
          )}
          {isCurrentPlayer && (
            <Eye className="w-4 h-4 text-game-purple flex-shrink-0" />
          )}
        </div>
        {showStatus && (
          <div className="flex items-center gap-2 mt-1">
            {player.isReady ? (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Check className="w-3 h-3" />
                جاهز
              </span>
            ) : (
              <span className="text-xs text-white/40">في الانتظار...</span>
            )}
          </div>
        )}
        {showScore && (
          <div className="mt-1 text-sm font-bold text-game-cyan">
            {player.score} نقطة
          </div>
        )}
      </div>

      {/* Crown for host or top score */}
      {player.id === 'player-1' && (
        <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
      )}

      {/* Glow effect for selected */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            background: `radial-gradient(circle at center, ${player.color}20, transparent 70%)`,
          }}
        />
      )}
    </motion.div>
  );
}
