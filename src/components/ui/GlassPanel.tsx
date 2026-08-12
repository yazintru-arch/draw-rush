import { motion } from 'framer-motion';
import { cn } from '../../hooks/useGameState';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'purple' | 'cyan' | 'pink' | 'none';
  intensity?: 'light' | 'medium' | 'strong';
  animate?: boolean;
}

export function GlassPanel({ 
  children, 
  className, 
  glow = 'none',
  intensity = 'medium',
  animate = true 
}: GlassPanelProps) {
  const glowStyles = {
    purple: 'neon-border-purple',
    cyan: 'neon-border-cyan',
    pink: 'border border-game-pink/50 shadow-[0_0_20px_rgba(236,72,153,0.2)]',
    none: '',
  };

  const intensityStyles = {
    light: 'bg-white/[0.03] backdrop-blur-lg',
    medium: 'bg-white/[0.05] backdrop-blur-xl',
    strong: 'bg-white/[0.08] backdrop-blur-2xl',
  };

  const Component = animate ? motion.div : 'div';
  const motionProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' },
  } : {};

  return (
    <Component
      {...motionProps}
      className={cn(
        'rounded-2xl border border-white/10',
        intensityStyles[intensity],
        glowStyles[glow],
        className
      )}
      style={{
        boxShadow: glow === 'none' 
          ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : undefined,
      }}
    >
      {children}
    </Component>
  );
}
