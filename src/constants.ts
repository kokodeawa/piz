import { BackgroundColor, PatternType } from './types';

export const DEFAULT_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#06b6d4', '#d946ef',
  '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#71717a'
];

export const NEON_COLORS = [
  '#ff00ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000', '#ff8000'
];

export const BACKGROUND_COLORS: { id: BackgroundColor; label: string; color: string }[] = [
  { id: 'white', label: 'Blanco', color: '#ffffff' },
  { id: 'black', label: 'Negro', color: '#18181b' },
  { id: 'green', label: 'Pizarra Verde', color: '#14532d' },
  { id: 'blue', label: 'Azul Oscuro', color: '#1e3a8a' },
  { id: 'steel', label: 'Acero Metálico', color: '#475569' },
  { id: 'charcoal', label: 'Carbón Metálico', color: '#27272a' },
  { id: 'mosaic', label: 'Mosaico', color: '#09090b' },
  { id: 'navy', label: 'Azul Marino', color: '#0f172a' },
  { id: 'space', label: 'Espacio', color: '#020617' },
  { id: 'pink', label: 'Rosa', color: '#fce7f3' },
  { id: 'bronze', label: 'Bronce', color: '#78350f' },
];

export const PATTERNS: { id: PatternType; label: string }[] = [
  { id: 'none', label: 'Liso' },
  { id: 'grid', label: 'Cuadrícula' },
  { id: 'dots', label: 'Puntos' },
  { id: 'lines', label: 'Líneas' },
  { id: 'isometric', label: 'Isométrico' },
];

export const STICKERS = [
  '⭐', '❤️', '👍', '👎', '🔥', '💡', '🎉', '✅', '❌', '❓', '❗', '💯'
];
