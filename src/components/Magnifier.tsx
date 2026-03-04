import React, { useState, useRef, useMemo } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Image as KonvaImage } from 'react-konva';
import { Element, BackgroundColor, PatternType, Tool } from '../types';
import { NEON_COLORS } from '../constants';
import { Move, X, Grip } from 'lucide-react';
import useImage from 'use-image';

const GalaxyBackground = React.memo(() => {
  const stars = useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) => {
      const isRare = Math.random() > 0.95;
      const rareColors = ['#ffcccc', '#ccccff', '#ccffcc', '#ffffcc', '#ffccff'];
      const color = isRare ? rareColors[Math.floor(Math.random() * rareColors.length)] : 'white';
      return {
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: isRare ? 2 + Math.random() * 2 : 1 + Math.random() * 2,
        height: isRare ? 2 + Math.random() * 2 : 1 + Math.random() * 2,
        color,
        isRare,
        duration: 4 + Math.random() * 8,
        delay: Math.random() * 10,
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="galaxy-container">
        {stars.map((star) => (
          <div
            key={`star-${star.id}`}
            className="star"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.width}px`,
              height: `${star.height}px`,
              backgroundColor: star.color,
              boxShadow: star.isRare ? `0 0 4px ${star.color}` : 'none',
              '--duration': `${star.duration}s`,
              '--delay': `${star.delay}s`,
            } as any}
          />
        ))}
      </div>
    </div>
  );
});

const MosaicBackground = React.memo(() => {
  const tiles = useMemo(() => {
    return Array.from({ length: 144 }).map((_, i) => ({
      id: i,
      left: `${(i % 12) * (100 / 12)}%`,
      top: `${Math.floor(i / 12) * (100 / 12)}%`,
      width: `${100 / 12 + 0.1}%`,
      height: `${100 / 12 + 0.1}%`,
      color: `hsla(${Math.random() * 360}, 60%, 10%, 1)`,
      duration: 35,
      delay: Math.random() * 35,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-zinc-950">
      {tiles.map((tile) => (
        <div
          key={`mosaic-${tile.id}`}
          className="mosaic-tile"
          style={{
            left: tile.left,
            top: tile.top,
            width: tile.width,
            height: tile.height,
            '--tile-color': tile.color,
            '--duration': `${tile.duration}s`,
            '--delay': `${tile.delay}s`,
          } as any}
        />
      ))}
    </div>
  );
});

const getBackgroundColor = (backgroundColor: BackgroundColor) => {
  switch (backgroundColor) {
    case 'green': return '#1a472a';
    case 'navy': return '#0a192f';
    case 'black': return '#000000';
    case 'space': return '#050508';
    case 'pink': return '#fff0f5';
    case 'steel': return '#4682b4';
    case 'charcoal': return '#36454f';
    case 'mosaic': return '#050505';
    default: return 'white';
  }
};

const getBackgroundClass = (backgroundColor: BackgroundColor) => {
  switch (backgroundColor) {
    case 'steel': return 'metallic-steel';
    case 'charcoal': return 'metallic-charcoal';
    case 'green': return 'metallic-green';
    case 'navy': return 'metallic-navy';
    case 'bronze': return 'metallic-bronze';
    default: return '';
  }
};

interface MagnifierProps {
  elements: Element[];
  setElements: React.Dispatch<React.SetStateAction<Element[]>>;
  addToHistory: (elements: Element[]) => void;
  backgroundColor: BackgroundColor;
  pattern: PatternType;
  mainStagePos: { x: number; y: number };
  mainStageScale: number;
  onClose: () => void;
  lazyMode: boolean;
  lazyIntensity: number;
  tool: Tool;
  color: string;
  strokeWidth: number;
  pos: { x: number; y: number };
  setPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  size: { width: number; height: number };
  setSize: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>;
}

const URLImage = ({ src, x, y, width, height }: any) => {
  const [img] = useImage(src);
  return <KonvaImage image={img} x={x} y={y} width={width} height={height} />;
};

export const Magnifier: React.FC<MagnifierProps> = ({
  elements,
  setElements,
  addToHistory,
  backgroundColor,
  pattern,
  mainStagePos,
  mainStageScale,
  onClose,
  lazyMode,
  lazyIntensity,
  tool,
  color,
  strokeWidth,
  pos,
  setPos,
  size,
  setSize,
}) => {
  const [zoomLevel, setZoomLevel] = useState(2);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const initialSize = useRef({ width: 0, height: 0 });

  const magnifierScale = mainStageScale * zoomLevel;

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);
  const [laserTrails, setLaserTrails] = useState<{ id: string; strokeId: string; x: number; y: number; timestamp: number }[]>([]);
  const currentLaserStrokeId = useRef<string | null>(null);
  const lazyPosRef = useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setLaserTrails(prev => prev.filter(t => now - t.timestamp < 3000));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const screenCenterX = pos.x + size.width / 2;
  const screenCenterY = pos.y + size.height / 2;
  const stageX = (screenCenterX - mainStagePos.x) / mainStageScale;
  const stageY = (screenCenterY - mainStagePos.y) / mainStageScale;
  const magStageX = size.width / 2 - stageX * magnifierScale;
  const magStageY = size.height / 2 - stageY * magnifierScale;

  const handlePointerDown = (e: any, type: 'drag' | 'resize' | 'draw') => {
    if (type === 'drag') setIsDragging(true);
    else if (type === 'resize') setIsResizing(true);
    else if (type === 'draw') {
      setIsDrawing(true);
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const stageX = (pos.x - magStageX) / magnifierScale;
      const stageY = (pos.y - magStageY) / magnifierScale;
      lazyPosRef.current = { x: stageX, y: stageY };
      
      if (tool === 'laser') {
        currentLaserStrokeId.current = Math.random().toString(36).substring(7);
      } else {
        setCurrentPoints([stageX, stageY]);
      }
      return;
    }
    const touch = e.evt?.touches?.[0];
    dragStartPos.current = { 
      x: touch?.clientX ?? e.evt?.clientX ?? e.clientX ?? 0, 
      y: touch?.clientY ?? e.evt?.clientY ?? e.clientY ?? 0 
    };
    initialPos.current = { ...pos };
    initialSize.current = { ...size };
    const pointerId = e.evt?.pointerId ?? e.pointerId;
    if (e.target && typeof e.target.setPointerCapture === 'function' && pointerId !== undefined) {
      e.target.setPointerCapture(pointerId);
    }
  };

  const handlePointerMove = (e: any) => {
    if (isDrawing) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const stageX = (pos.x - magStageX) / magnifierScale;
      const stageY = (pos.y - magStageY) / magnifierScale;
      
      let targetX = stageX;
      let targetY = stageY;

      if (lazyMode) {
        const lerp = lazyIntensity;
        targetX = lazyPosRef.current.x + (stageX - lazyPosRef.current.x) * lerp;
        targetY = lazyPosRef.current.y + (stageY - lazyPosRef.current.y) * lerp;
        lazyPosRef.current = { x: targetX, y: targetY };
      }

      if (tool === 'laser' && currentLaserStrokeId.current) {
        const newTrail = { id: Date.now().toString() + Math.random(), strokeId: currentLaserStrokeId.current, x: targetX, y: targetY, timestamp: Date.now() };
        setLaserTrails(prev => [...prev, newTrail]);
      } else {
        setCurrentPoints(prev => [...prev, targetX, targetY]);
      }
      return;
    }

    const touch = e.evt?.touches?.[0];
    const clientX = touch?.clientX ?? e.evt?.clientX ?? e.clientX;
    const clientY = touch?.clientY ?? e.evt?.clientY ?? e.clientY;
    if (clientX === undefined || clientY === undefined) return;

    if (isDragging) {
      const dx = clientX - dragStartPos.current.x;
      const dy = clientY - dragStartPos.current.y;
      setPos({ x: initialPos.current.x + dx, y: initialPos.current.y + dy });
    } else if (isResizing) {
      const dx = clientX - dragStartPos.current.x;
      const dy = clientY - dragStartPos.current.y;
      
      const newWidth = Math.max(150, initialSize.current.width - dx);
      const newHeight = Math.max(100, initialSize.current.height + dy);
      const newX = initialPos.current.x + (initialSize.current.width - newWidth);

      setSize({
        width: newWidth,
        height: newHeight,
      });
      setPos({
        x: newX,
        y: initialPos.current.y
      });
    }
  };

  const handlePointerUp = (e: any) => {
    if (isDrawing) {
      if (tool === 'laser') {
        currentLaserStrokeId.current = null;
      } else if (currentPoints.length > 0) {
        const newElement: Element = {
          id: Math.random().toString(36).substring(7),
          type: tool === 'eraser' ? 'eraser' : 'pen',
          color: tool === 'eraser' ? '#ffffff' : color,
          strokeWidth: tool === 'eraser' ? 20 : strokeWidth,
          points: currentPoints,
        };
        const newElements = [...elements, newElement];
        setElements(newElements);
        addToHistory(newElements);
      }
    }
    setIsDragging(false);
    setIsResizing(false);
    setIsDrawing(false);
    setCurrentPoints([]);
    const pointerId = e.evt?.pointerId ?? e.pointerId;
    if (e.target && typeof e.target.releasePointerCapture === 'function' && pointerId !== undefined) {
      e.target.releasePointerCapture(pointerId);
    }
  };

  return (
    <div
      className={`relative overflow-hidden ${getBackgroundClass(backgroundColor)}`}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
        border: `4px solid ${['black', 'space', 'navy', 'charcoal', 'green', 'mosaic'].includes(backgroundColor) ? '#ffffff' : '#000000'}`,
        borderRadius: '12px',
        backgroundColor: getBackgroundColor(backgroundColor),
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        zIndex: 100,
        touchAction: 'none',
      }}
    >
      {/* Animated Star Background (Static) */}
      {backgroundColor === 'space' && <GalaxyBackground />}

      {/* Mosaic Background */}
      {backgroundColor === 'mosaic' && <MosaicBackground />}
      <div style={{ position: 'absolute', top: 4, left: 4, zIndex: 101, display: 'flex', gap: 4 }}>
        {[2, 3, 4].map(z => (
          <button key={z} onClick={() => setZoomLevel(z)} style={{ padding: '2px 6px', backgroundColor: zoomLevel === z ? '#000' : '#fff', color: zoomLevel === z ? '#fff' : '#000', borderRadius: '4px', border: '1px solid #000', fontSize: 10 }}>x{z}</button>
        ))}
      </div>
      <Stage 
        width={size.width} 
        height={size.height} 
        x={magStageX} 
        y={magStageY} 
        scaleX={magnifierScale} 
        scaleY={magnifierScale}
        onMouseDown={(e) => handlePointerDown(e as any, 'draw')}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={(e) => handlePointerDown(e as any, 'draw')}
        onTouchMove={(e) => handlePointerMove(e as any)}
        onTouchEnd={(e) => handlePointerUp(e as any)}
      >
        <Layer>
          {elements.map((el) => {
            const strokeWidth = (el.strokeWidth || 1);
            if (el.type === 'pen' || el.type === 'eraser' || el.type === 'line') {
              return (
                <Line 
                  key={el.id} 
                  points={el.points} 
                  stroke={el.color} 
                  strokeWidth={strokeWidth} 
                  tension={0.5} 
                  lineCap="round" 
                  lineJoin="round" 
                  globalCompositeOperation={el.type === 'eraser' ? 'destination-out' : 'source-over'} 
                  shadowColor={NEON_COLORS.includes(el.color) ? el.color : undefined}
                  shadowBlur={NEON_COLORS.includes(el.color) ? 15 : 0}
                  shadowOpacity={NEON_COLORS.includes(el.color) ? 0.8 : 0}
                />
              );
            } else if (el.type === 'rect') {
              return (
                <Rect 
                  key={el.id} 
                  x={el.x} 
                  y={el.y} 
                  width={el.width} 
                  height={el.height} 
                  stroke={el.color} 
                  strokeWidth={strokeWidth}
                  shadowColor={NEON_COLORS.includes(el.color) ? el.color : undefined}
                  shadowBlur={NEON_COLORS.includes(el.color) ? 15 : 0}
                  shadowOpacity={NEON_COLORS.includes(el.color) ? 0.8 : 0}
                />
              );
            } else if (el.type === 'circle') {
              return (
                <Circle 
                  key={el.id} 
                  x={el.x} 
                  y={el.y} 
                  radius={el.radius} 
                  stroke={el.color} 
                  strokeWidth={strokeWidth}
                  shadowColor={NEON_COLORS.includes(el.color) ? el.color : undefined}
                  shadowBlur={NEON_COLORS.includes(el.color) ? 15 : 0}
                  shadowOpacity={NEON_COLORS.includes(el.color) ? 0.8 : 0}
                />
              );
            } else if (el.type === 'text') {
              return <Text key={el.id} x={el.x} y={el.y} text={el.text} fontSize={(el.strokeWidth || 10) * 4} fill={el.color} fontFamily="sans-serif" />;
            } else if (el.type === 'image') {
              return <URLImage key={el.id} src={el.src} x={el.x} y={el.y} width={el.width} height={el.height} />;
            }
            return null;
          })}
          {isDrawing && tool !== 'laser' && <Line points={currentPoints} stroke={tool === 'eraser' ? '#ffffff' : color} strokeWidth={tool === 'eraser' ? 20 : strokeWidth} tension={0.5} lineCap="round" lineJoin="round" />}
          
          {/* Laser Trails */}
          {tool === 'laser' && laserTrails.map((trail, i) => {
            if (i === 0) return null;
            const prev = laserTrails[i - 1];
            if (prev.strokeId !== trail.strokeId) return null;
            const age = (Date.now() - trail.timestamp) / 3000;
            return (
              <Line
                key={trail.id}
                points={[prev.x, prev.y, trail.x, trail.y]}
                stroke="red"
                strokeWidth={2 / mainStageScale}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                opacity={Math.max(0, 0.8 * (1 - age))}
                shadowColor="red"
                shadowBlur={10 / mainStageScale}
                shadowOpacity={0.8}
              />
            );
          })}
        </Layer>
      </Stage>

      {/* Crosshair */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 16,
        height: 16,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 102,
      }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,0,0,0.5)', transform: 'translateY(-50%)' }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(255,0,0,0.5)', transform: 'translateX(-50%)' }} />
      </div>

      <div onPointerDown={(e) => handlePointerDown(e as any, 'drag')} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, backgroundColor: '#000', borderTopLeftRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'move', touchAction: 'none' }}><Move color="#fff" size={16} style={{ pointerEvents: 'none' }} /></div>
      <div onPointerDown={(e) => handlePointerDown(e as any, 'resize')} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} style={{ position: 'absolute', bottom: 0, left: 0, width: 30, height: 30, backgroundColor: '#000', borderTopRightRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'nwse-resize', touchAction: 'none' }}><Grip color="#fff" size={16} style={{ pointerEvents: 'none' }} /></div>
      <button onClick={onClose} style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', zIndex: 101 }}><X size={14} /></button>
    </div>
  );
};
