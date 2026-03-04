import React from 'react';
import { Pencil, Crosshair, Hand, Plus, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Search, Sparkles } from 'lucide-react';
import { Tool } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface TopToolbarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  onAddPage: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  currentPage: number;
  totalPages: number;
  zoom: number;
  setZoom: (zoom: number) => void;
  isMagnifierActive: boolean;
  setIsMagnifierActive: (active: boolean) => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  tool,
  setTool,
  onAddPage,
  onPrevPage,
  onNextPage,
  currentPage,
  totalPages,
  zoom,
  setZoom,
  isMagnifierActive,
  setIsMagnifierActive
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="w-3 h-6 bg-white/50 hover:bg-white/80 backdrop-blur-md border-y border-l border-black/5 rounded-l-md flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all shadow-sm"
      >
        {isVisible ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="flex flex-col items-center gap-1.5 liquid-glass p-1 rounded-l-xl shadow-[0_8px_32_rgba(0,0,0,0.1)] mr-1 max-h-[80vh] overflow-y-auto scrollbar-hide w-10"
          >
            <div className="flex flex-col items-center gap-0.5 border-b border-black/5 pb-1.5 w-full">
              <ToolButton
                active={tool === 'hand'}
                onClick={() => setTool('hand')}
                icon={<Hand size={16} />}
                title="Mover (Mano)"
              />
              <ToolButton
                active={tool === 'pointer'}
                onClick={() => setTool('pointer')}
                icon={<Crosshair size={16} />}
                title="Puntero"
              />
              <ToolButton
                active={tool === 'laser'}
                onClick={() => setTool('laser')}
                icon={<Sparkles size={16} />}
                title="Puntero Láser"
              />
            </div>

            <div className="flex flex-col items-center gap-0.5 border-b border-black/5 pb-1.5 w-full">
              <ActionButton
                onClick={() => setZoom(Math.max(0.1, zoom / 1.1))}
                icon={<ZoomOut size={16} />}
                title="Alejar"
              />
              <div className="text-[9px] font-bold w-full text-center text-zinc-600 py-0.5">{(zoom * 100).toFixed(0)}%</div>
              <ActionButton
                onClick={() => setZoom(Math.min(10, zoom * 1.1))}
                icon={<ZoomIn size={16} />}
                title="Acercar"
              />
              <ActionButton
                onClick={() => setZoom(1)}
                icon={<Maximize size={14} />}
                title="Reset Zoom"
              />
              <ToolButton
                active={isMagnifierActive}
                onClick={() => setIsMagnifierActive(!isMagnifierActive)}
                icon={<Search size={16} />}
                title="Lupa"
              />
            </div>

            <div className="flex flex-col items-center gap-0.5 pt-0.5 w-full">
              <div className="flex flex-col items-center gap-0.5 mb-1 w-full">
                <ActionButton
                  onClick={onPrevPage}
                  disabled={currentPage <= 1}
                  icon={<ChevronLeft size={16} className="rotate-90" />}
                  title="Página anterior"
                />
                <span className="text-[9px] font-bold w-full text-center text-zinc-600 uppercase tracking-tighter py-0.5">
                  {currentPage}/{totalPages}
                </span>
                <ActionButton
                  onClick={onNextPage}
                  disabled={currentPage >= totalPages}
                  icon={<ChevronRight size={16} className="rotate-90" />}
                  title="Siguiente página"
                />
              </div>
              <ActionButton
                onClick={onAddPage}
                icon={<Plus size={16} />}
                title="Nueva Hoja"
                className="bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

const ActionButton = ({ onClick, disabled, icon, title, className = "" }: { onClick: () => void; disabled?: boolean; icon: React.ReactNode; title: string; className?: string }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 border bg-white/20 text-zinc-700 border-white/10 backdrop-blur-md ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95 hover:bg-white/40'} ${className}`}
  >
    {icon}
  </button>
);
