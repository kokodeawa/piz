import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface SymbolSidebarProps {
  onSymbolClick: (symbol: string) => void;
  color: string;
  strokeWidth: number;
  isVisible: boolean;
}

const SYMBOLS = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
  '+', '-', '·', '√', '=', '(', ')', '/', '*', '^'
];

export const SymbolSidebar: React.FC<SymbolSidebarProps> = ({ onSymbolClick, color, strokeWidth, isVisible }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="flex flex-row gap-1 max-w-[80vw] overflow-x-auto scrollbar-hide liquid-glass p-1.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] pointer-events-auto"
          >
            <div className="flex flex-row gap-1">
              {SYMBOLS.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => onSymbolClick(symbol)}
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white/30 hover:bg-zinc-900 hover:text-white rounded-lg transition-all duration-200 font-bold text-base border border-white/10 active:scale-90"
                  style={{ fontSize: Math.max(14, Math.min(20, strokeWidth * 1.5)) }}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
