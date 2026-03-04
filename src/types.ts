export type Tool = 'pen' | 'eraser' | 'line' | 'rect' | 'circle' | 'select' | 'pointer' | 'hand' | 'scissors' | 'laser' | 'crop-rect' | 'crop-free';

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: Tool | 'text' | 'image' | 'sticker';
  color: string;
  strokeWidth: number;
  rotation?: number;
}

export interface LineElement extends BaseElement {
  type: 'pen' | 'eraser' | 'line';
  points: number[];
}

export interface RectElement extends BaseElement {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
}

export interface TextElement extends BaseElement {
  type: 'text' | 'sticker';
  x: number;
  y: number;
  text: string;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
}

export type Element = LineElement | RectElement | CircleElement | TextElement | ImageElement;

export type BackgroundColor = 'white' | 'black' | 'green' | 'blue' | 'steel' | 'charcoal' | 'mosaic' | 'navy' | 'space' | 'pink' | 'bronze';
export type PatternType = 'none' | 'dots' | 'grid' | 'lines' | 'isometric';
