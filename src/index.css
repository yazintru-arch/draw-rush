@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-game-glassBorder;
  }

  body {
    @apply bg-game-bg text-white font-cairo antialiased;
    background: radial-gradient(ellipse at 20% 20%, rgba(168, 85, 247, 0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, rgba(6, 182, 212, 0.06) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(236, 72, 153, 0.04) 0%, transparent 60%),
                #0a0a1a;
    min-height: 100vh;
  }

  ::selection {
    @apply bg-game-purple/30 text-white;
  }
}

@layer components {
  .glass-panel {
    @apply bg-game-glass backdrop-blur-xl border border-game-glassBorder rounded-2xl;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .glass-panel-strong {
    @apply bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .neon-border-purple {
    @apply border border-game-purple/50;
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.2), inset 0 0 20px rgba(168, 85, 247, 0.05);
  }

  .neon-border-cyan {
    @apply border border-game-cyan/50;
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.2), inset 0 0 20px rgba(6, 182, 212, 0.05);
  }

  .neon-text-purple {
    text-shadow: 0 0 10px rgba(168, 85, 247, 0.5), 0 0 30px rgba(168, 85, 247, 0.3);
  }

  .neon-text-cyan {
    text-shadow: 0 0 10px rgba(6, 182, 212, 0.5), 0 0 30px rgba(6, 182, 212, 0.3);
  }

  .gradient-text {
    @apply bg-clip-text text-transparent;
    background-image: linear-gradient(135deg, #c084fc 0%, #22d3ee 50%, #f472b6 100%);
  }

  .btn-primary {
    @apply relative overflow-hidden bg-game-purple hover:bg-game-purpleLight text-white font-bold py-4 px-8 rounded-xl transition-all duration-300;
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.3), 0 4px 15px rgba(0, 0, 0, 0.3);
  }

  .btn-primary:hover {
    box-shadow: 0 0 30px rgba(168, 85, 247, 0.5), 0 6px 20px rgba(0, 0, 0, 0.4);
    transform: translateY(-2px);
  }

  .btn-secondary {
    @apply relative overflow-hidden bg-game-cyan hover:bg-game-cyanLight text-white font-bold py-4 px-8 rounded-xl transition-all duration-300;
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.3), 0 4px 15px rgba(0, 0, 0, 0.3);
  }

  .btn-secondary:hover {
    box-shadow: 0 0 30px rgba(6, 182, 212, 0.5), 0 6px 20px rgba(0, 0, 0, 0.4);
    transform: translateY(-2px);
  }

  .game-card {
    @apply glass-panel p-6 transition-all duration-300 hover:scale-[1.02];
  }

  .game-card:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(168, 85, 247, 0.1);
  }

  .hud-line {
    @apply h-px bg-gradient-to-r from-transparent via-game-purple/50 to-transparent;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}

@layer utilities {
  .text-glow-purple {
    text-shadow: 0 0 20px rgba(168, 85, 247, 0.6);
  }
  .text-glow-cyan {
    text-shadow: 0 0 20px rgba(6, 182, 212, 0.6);
  }
}
