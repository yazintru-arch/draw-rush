import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Pencil, 
  Eraser, 
  Undo2, 
  Trash2, 
  Palette
} from 'lucide-react';
import { NeonButton } from '../ui/NeonButton';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  onSave?: (dataUrl: string) => void;
  readOnly?: boolean;
  initialData?: string;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  size: number;
  tool: 'pen' | 'eraser';
}

const COLORS = [
  '#ffffff', '#ef4444', '#f59e0b', '#22c55e', 
  '#06b6d4', '#3b82f6', '#a855f7', '#ec4899',
  '#78716c', '#000000'
];

const BRUSH_SIZES = [2, 4, 8, 12, 20];

export function DrawingCanvas({ 
  width = 800, 
  height = 500, 
  onSave,
  readOnly = false,
  initialData 
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw all strokes
    [...strokes, currentStroke].filter(Boolean).forEach((stroke) => {
      if (!stroke || stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const prev = stroke.points[i - 1];
        const curr = stroke.points[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.size;

      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
      }

      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    });
  }, [strokes, currentStroke]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    if (initialData && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = initialData;
    }
  }, [initialData]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDrawing(true);
    const point = getPoint(e);
    const newStroke: Stroke = {
      points: [point],
      color,
      size: brushSize,
      tool,
    };
    setCurrentStroke(newStroke);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    e.preventDefault();
    const point = getPoint(e);
    setCurrentStroke(prev => {
      if (!prev) return null;
      return { ...prev, points: [...prev.points, point] };
    });
  };

  const stopDrawing = () => {
    if (!isDrawing || readOnly) return;
    setIsDrawing(false);
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  };

  const undo = () => {
    setStrokes(prev => prev.slice(0, -1));
  };

  const clear = () => {
    setStrokes([]);
    setCurrentStroke(null);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (canvas && onSave) {
      onSave(canvas.toDataURL('image/png'));
    }
  };

  if (readOnly && initialData) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-white/10">
        <img 
          src={initialData} 
          alt="Drawing" 
          className="w-full h-auto"
          style={{ maxHeight: height, objectFit: 'contain', background: '#0f0f1a' }}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      {/* Toolbar */}
      {!readOnly && (
        <div className="glass-panel p-3 flex flex-wrap items-center gap-3">
          {/* Tools */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-md transition-all ${tool === 'pen' ? 'bg-game-purple text-white' : 'text-white/50 hover:text-white'}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-md transition-all ${tool === 'eraser' ? 'bg-game-purple text-white' : 'text-white/50 hover:text-white'}`}
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Brush Sizes */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {BRUSH_SIZES.map(size => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`p-2 rounded-md transition-all flex items-center justify-center ${brushSize === size ? 'bg-game-cyan text-white' : 'text-white/50 hover:text-white'}`}
              >
                <div 
                  className="rounded-full bg-current"
                  style={{ width: Math.min(size, 16), height: Math.min(size, 16) }}
                />
              </button>
            ))}
          </div>

          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <div 
                className="w-5 h-5 rounded-full border-2 border-white/20"
                style={{ backgroundColor: color }}
              />
              <Palette className="w-4 h-4 text-white/50" />
            </button>

            {showColorPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-full mt-2 right-0 glass-panel p-3 grid grid-cols-5 gap-2 z-50"
              >
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => { setColor(c); setShowColorPicker(false); }}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent hover:border-white/30'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </motion.div>
            )}
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={strokes.length === 0}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-30"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={clear}
              className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden border-2 border-white/10" style={{ background: '#0f0f1a' }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full touch-none ${readOnly ? '' : 'cursor-crosshair'}`}
          style={{ aspectRatio: `${width}/${height}` }}
        />

        {/* Canvas corner decorations */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-game-cyan/50" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-game-cyan/50" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-game-cyan/50" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-game-cyan/50" />
      </div>

      {/* Save button */}
      {onSave && !readOnly && (
        <div className="flex justify-end">
          <NeonButton variant="cyan" onClick={save}>
            حفظ الرسمة
          </NeonButton>
        </div>
      )}
    </div>
  );
}
