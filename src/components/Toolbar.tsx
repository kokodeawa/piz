import React from 'react';
import {
  Pencil,
  Eraser,
  Square,
  Circle as CircleIcon,
  Minus,
  Undo2,
  Redo2,
  Trash2,
  Type,
  MousePointer2,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Palette,
  Settings2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Image as ImageIcon,
  Smile,
  Upload,
  Scissors,
  Zap,
  Download,
  Crop,
  Lasso,
  Grid,
  Calculator
} from 'lucide-react';
import { Tool, BackgroundColor, PatternType } from '../types';
import { DEFAULT_COLORS, NEON_COLORS, BACKGROUND_COLORS, PATTERNS, STICKERS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface ToolbarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  onClear: () => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  lazyMode: boolean;
  setLazyMode: (lazy: boolean) => void;
  lazyIntensity: number;
  setLazyIntensity: (intensity: number) => void;
  backgroundColor: BackgroundColor;
  setBackgroundColor: (bg: BackgroundColor) => void;
  pattern: PatternType;
  setPattern: (p: PatternType) => void;
  zoom: number;
  setZoom: (z: number) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddSticker: (sticker: string) => void;
  smartStrokes: boolean;
  setSmartStrokes: (s: boolean) => void;
  onDownloadPDF: () => void;
  showSymbolMenu: boolean;
  setShowSymbolMenu: (show: boolean) => void;
}



export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  color,
  setColor,
  onClear,
  strokeWidth,
  setStrokeWidth,
  lazyMode,
  setLazyMode,
  lazyIntensity,
  setLazyIntensity,
  backgroundColor,
  setBackgroundColor,
  pattern,
  setPattern,
  zoom,
  setZoom,
  onImageUpload,
  onAddSticker,
  smartStrokes,
  setSmartStrokes,
  onDownloadPDF,
  showSymbolMenu,
  setShowSymbolMenu
}) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showStickers, setShowStickers] = React.useState(false);
  const [showColorMenu, setShowColorMenu] = React.useState(false);
  const [showCropMenu, setShowCropMenu] = React.useState(false);
  const [showBackgroundMenu, setShowBackgroundMenu] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const colorMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close color menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorMenuRef.current && !colorMenuRef.current.contains(event.target as Node)) {
        // Check if the click was on the pencil button (to avoid immediate reopening)
        const target = event.target as HTMLElement;
        if (!target.closest('[data-tool="pen"]')) {
          setShowColorMenu(false);
        }
      }
    };

    if (showColorMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorMenu]);

  const handlePencilClick = () => {
    if (tool === 'pen') {
      setShowColorMenu(!showColorMenu);
    } else {
      setTool('pen');
      // Optionally open menu when switching to pen? User didn't specify, but "al tocar el pincel otra vez" implies only when already active.
    }
  };

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="relative ml-1"
          >
            {/* Crop Menu */}
            <AnimatePresence>
              {showCropMenu && (
                <motion.div
                  initial={{ opacity: 0, x: 10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.95 }}
                  className="absolute left-full top-0 ml-3 pointer-events-auto bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-2 flex gap-2 w-max z-50"
                >
                  <button
                    onClick={() => {
                      setTool('crop-rect');
                      setShowCropMenu(false);
                    }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${tool === 'crop-rect' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-black/5'}`}
                  >
                    <Crop size={16} />
                    <span className="text-xs font-medium">Cuadrícula</span>
                  </button>
                  <button
                    onClick={() => {
                      setTool('crop-free');
                      setShowCropMenu(false);
                    }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${tool === 'crop-free' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-black/5'}`}
                  >
                    <Lasso size={16} />
                    <span className="text-xs font-medium">Libre</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Background Menu */}
            <AnimatePresence>
              {showBackgroundMenu && (
                <motion.div
                  initial={{ opacity: 0, x: 10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.95 }}
                  className="absolute left-full top-0 ml-3 pointer-events-auto bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-3 w-64 z-50"
                >
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Fondo</span>
                      <div className="grid grid-cols-5 gap-1.5">
                        {BACKGROUND_COLORS.map((bg) => (
                          <button
                            key={bg.id}
                            onClick={() => setBackgroundColor(bg.id)}
                            title={bg.label}
                            className={`w-7 h-7 rounded-full border border-black/5 transition-all ${
                              backgroundColor === bg.id ? 'ring-2 ring-zinc-900 ring-offset-2 scale-110' : 'hover:scale-110'
                            } ${
                              bg.id === 'steel' ? 'metallic-steel' :
                              bg.id === 'charcoal' ? 'metallic-charcoal' :
                              bg.id === 'mosaic' ? 'bg-zinc-950' : ''
                            }`}
                            style={{ backgroundColor: bg.id === 'steel' || bg.id === 'charcoal' ? undefined : bg.color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Patrón</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PATTERNS.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setPattern(p.id)}
                            className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-all ${
                              pattern === p.id 
                                ? 'bg-zinc-900 text-white border-zinc-900' 
                                : 'bg-white text-zinc-600 border-black/5 hover:bg-black/5'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Color Menu Popover (Now includes Stroke Width) */}
            <AnimatePresence>
              {showColorMenu && (
                <motion.div
                  ref={colorMenuRef}
                  initial={{ opacity: 0, x: 10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.95 }}
                  className="absolute left-full top-0 ml-3 pointer-events-auto bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-3 w-64 z-50 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider">Color y Grosor</span>
                    <button onClick={() => setShowColorMenu(false)} className="text-zinc-400 hover:text-zinc-600">
                      <Crosshair size={12} className="rotate-45" />
                    </button>
                  </div>

                  {/* Stroke Width Slider */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                      <span>Grosor</span>
                      <span>{strokeWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="40"
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                      className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                    />
                  </div>

                  <div className="h-px bg-black/5" />

                  {/* Classic Colors */}
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Clásicos</span>
                    <div className="grid grid-cols-6 gap-1.5">
                      {DEFAULT_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          className={`w-5 h-5 rounded-full border border-black/5 transition-transform hover:scale-125 ${
                            color === c ? 'ring-2 ring-zinc-900 ring-offset-1 scale-110' : ''
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Neon Colors */}
                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Neón</span>
                      <Zap size={10} className="text-yellow-500 fill-yellow-500 animate-pulse" />
                    </div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {NEON_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          className={`w-5 h-5 rounded-full border border-black/5 transition-transform hover:scale-125 ${
                            color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-black scale-110' : ''
                          } shadow-[0_0_10px_rgba(255,255,255,0.5)]`}
                          style={{ 
                            backgroundColor: c,
                            boxShadow: `0 0 10px ${c}, 0 0 20px ${c}`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Settings Popover */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, x: 10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.95 }}
                  className="absolute left-full top-0 ml-3 liquid-glass p-3 rounded-2xl shadow-xl flex flex-col gap-3 w-64 z-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900">Suavizado (Lazy Mode)</span>
                    <button 
                      onClick={() => setLazyMode(!lazyMode)}
                      className={`w-8 h-4 rounded-full transition-colors relative ${lazyMode ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${lazyMode ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                  
                  {lazyMode && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                        <span>Intensidad</span>
                        <span>{(lazyIntensity * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="0.5"
                        step="0.01"
                        value={lazyIntensity}
                        onChange={(e) => setLazyIntensity(parseFloat(e.target.value))}
                        className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                      />
                    </div>
                  )}

                  <div className="h-px bg-black/5" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-zinc-600" />
                      <span className="text-xs font-bold text-zinc-900">Trazos Inteligentes</span>
                    </div>
                    <button 
                      onClick={() => setSmartStrokes(!smartStrokes)}
                      className={`w-8 h-4 rounded-full transition-colors relative ${smartStrokes ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${smartStrokes ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                  </div>

                  <div className="h-px bg-black/5" />

                  <button
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que quieres borrar la memoria caché? Esto recargará la página.')) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="flex items-center justify-between w-full py-1.5 px-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-xs font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 size={14} />
                      Limpiar Caché
                    </span>
                  </button>

                  <button
                    onClick={onDownloadPDF}
                    className="flex items-center justify-center gap-2 w-full py-1.5 px-3 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all shadow-md active:scale-95"
                  >
                    <Download size={14} />
                    Descargar PDF
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Stickers Popover */}
            <AnimatePresence>
              {showStickers && (
                <motion.div
                  initial={{ opacity: 0, x: 10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.95 }}
                  className="absolute left-full top-0 ml-3 liquid-glass p-2 rounded-2xl shadow-xl flex flex-wrap gap-1.5 w-48 mb-2 z-50"
                >
                  {STICKERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        onAddSticker(s);
                        setShowStickers(false);
                      }}
                      className="text-xl hover:scale-125 transition-transform p-0.5"
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col items-center gap-1.5 liquid-glass p-1 rounded-r-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] max-h-[80vh] overflow-y-auto scrollbar-hide w-10">
              {/* Drawing Tools */}
              <div className="flex flex-col items-center justify-center gap-0.5 border-b border-black/5 pb-1.5 w-full">
                <div data-tool="pen">
                  <ToolButton
                    active={tool === 'pen'}
                    onClick={handlePencilClick}
                    icon={<Pencil size={16} />}
                    title="Lápiz (Click para color/grosor)"
                  />
                </div>
                <ToolButton
                  active={tool === 'eraser'}
                  onClick={() => setTool('eraser')}
                  icon={<Eraser size={16} />}
                  title="Borrador"
                />
                <ToolButton
                  active={tool === 'line'}
                  onClick={() => setTool('line')}
                  icon={<Minus size={16} />}
                  title="Línea"
                />
                <ToolButton
                  active={tool === 'rect'}
                  onClick={() => setTool('rect')}
                  icon={<Square size={16} />}
                  title="Rectángulo"
                />
                <ToolButton
                  active={tool === 'circle'}
                  onClick={() => setTool('circle')}
                  icon={<CircleIcon size={16} />}
                  title="Círculo"
                />
                <ToolButton
                  active={tool === 'scissors' || tool === 'crop-rect' || tool === 'crop-free'}
                  onClick={() => setShowCropMenu(!showCropMenu)}
                  icon={<Scissors size={16} />}
                  title="Recortar"
                />
                <ToolButton
                  active={showBackgroundMenu}
                  onClick={() => setShowBackgroundMenu(!showBackgroundMenu)}
                  icon={<Grid size={16} />}
                  title="Fondo y Patrón"
                />
                <ToolButton
                  active={showSettings}
                  onClick={() => setShowSettings(!showSettings)}
                  icon={<Settings2 size={16} />}
                  title="Ajustes"
                />
                <ToolButton
                  active={showSymbolMenu}
                  onClick={() => setShowSymbolMenu(!showSymbolMenu)}
                  icon={<Calculator size={16} />}
                  title="Símbolos Matemáticos"
                />
                <div className="w-4 h-px bg-black/5 my-0.5" />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <ActionButton
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Upload size={16} />}
                  title="Subir Imagen"
                />
                <ActionButton
                  active={showStickers}
                  onClick={() => setShowStickers(!showStickers)}
                  icon={<Smile size={16} />}
                  title="Stickers"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center gap-0.5 w-full">
                <ActionButton
                  onClick={onClear}
                  icon={<Trash2 size={16} className="text-red-500" />}
                  title="Limpiar Lienzo"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsVisible(!isVisible)}
        className="w-3 h-6 bg-white/50 hover:bg-white/80 backdrop-blur-md border-y border-r border-black/5 rounded-r-md flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all shadow-sm"
      >
        {isVisible ? <ChevronLeft size={10} /> : <ChevronRight size={10} />}
      </button>
    </div>
  );
};

const ToolButton = ({ active, onClick, icon, title }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string }) => (
  <button
    onClick={onClick}
    title={title}
    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 border ${active ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg scale-105' : 'bg-white/20 text-zinc-700 border-white/10 hover:bg-white/40 backdrop-blur-md'}`}
  >
    {icon}
  </button>
);

const ActionButton = ({ onClick, disabled, active, icon, title, className = "" }: { onClick: () => void; disabled?: boolean; active?: boolean; icon: React.ReactNode; title: string; className?: string }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 border bg-white/20 text-zinc-700 border-white/10 backdrop-blur-md ${active ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg' : ''} ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95 hover:bg-white/40'} ${className}`}
  >
    {icon}
  </button>
);
