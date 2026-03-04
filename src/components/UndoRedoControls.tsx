import React from 'react';
import { Undo2, Redo2 } from 'lucide-react';

interface UndoRedoControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <ActionButton
        onClick={onUndo}
        disabled={!canUndo}
        icon={<Undo2 size={20} />}
        title="Deshacer"
      />
      <ActionButton
        onClick={onRedo}
        disabled={!canRedo}
        icon={<Redo2 size={20} />}
        title="Rehacer"
      />
    </div>
  );
};

const ActionButton = ({ onClick, disabled, icon, title }: { onClick: () => void; disabled?: boolean; icon: React.ReactNode; title: string }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 border bg-white/20 text-zinc-700 border-white/10 backdrop-blur-md shadow-lg ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95 hover:bg-white/40 hover:text-zinc-900'}`}
  >
    {icon}
  </button>
);
