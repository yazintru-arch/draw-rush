import { motion } from 'framer-motion';
import { cn } from '../../hooks/useGameState';

interface NeonButtonProps {
  children: React.ReactNode;
  variant?: 'purple' | 'cyan' | 'pink' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function NeonButton({
  children,
  variant = 'purple',
  size = 'md',
  className,
  onClick,
  disabled = false,
  icon,
}: NeonButtonProps) {
  const variants = {
    purple: 'bg-game-purple hover:bg-game-purpleLight text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]',
    cyan: 'bg-game-cyan hover:bg-game-cyanLight text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]',
    pink: 'bg-game-pink hover:bg-game-pinkLight text-white shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]',
    outline: 'bg-transparent border-2 border-white/20 hover:border-white/40 text-white hover:bg-white/5',
    ghost: 'bg-transparent hover:bg-white/5 text-white/80 hover:text-white',
  };

  const sizes = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-10 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.03, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative overflow-hidden rounded-xl font-bold transition-all duration-300 flex items-center gap-2 justify-center',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
}
