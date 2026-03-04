import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Group, Transformer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { Scissors, Plus } from 'lucide-react';
import { Tool, Element, Point, BackgroundColor, PatternType, ImageElement, LineElement } from '../types';
import { NEON_COLORS } from '../constants';

const URLImage = ({ src, x, y, width, height, id, onSelect, isSelected, onChange }: any) => {
  const [img] = useImage(src);
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <KonvaImage
        image={img}
        x={x}
        y={y}
        width={width}
        height={height}
        id={id}
        ref={shapeRef}
        onClick={onSelect}
        onTap={onSelect}
        draggable={isSelected}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

interface WhiteboardProps {
  tool: Tool;
  setTool?: (tool: Tool) => void;
  color: string;
  strokeWidth: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  elements: Element[];
  setElements: React.Dispatch<React.SetStateAction<Element[]>>;
  addToHistory: (elements: Element[]) => void;
  lazyMode: boolean;
  lazyIntensity: number;
  backgroundColor: BackgroundColor;
  pattern: PatternType;
  zoom: number;
  setZoom: (zoom: number) => void;
  pendingSymbol?: { symbol: string; timestamp: number } | null;
  smartStrokes: boolean;
  setMainStagePos?: (pos: { x: number; y: number }) => void;
  isMagnifierActive?: boolean;
  magnifierPos?: { x: number; y: number };
  magnifierSize?: { width: number; height: number };
}

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
      duration: 35, // Fixed 35s cycle as requested
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

export const Whiteboard: React.FC<WhiteboardProps> = ({
  tool,
  setTool,
  color,
  strokeWidth,
  elements,
  setElements,
  addToHistory,
  onUndo,
  onRedo,
  lazyMode,
  lazyIntensity,
  backgroundColor,
  pattern,
  zoom,
  setZoom,
  pendingSymbol,
  smartStrokes,
  setMainStagePos,
  isMagnifierActive,
  magnifierPos,
  magnifierSize,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<Element | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const stageRef = useRef<any>(null);
  const elementsRef = useRef<Element[]>(elements);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<Element[]>([]);
  const trRef = useRef<any>(null);
  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  useEffect(() => {
    if (selectedIds.length > 0 && trRef.current) {
      const stage = stageRef.current;
      const nodes = selectedIds.map(id => stage.findOne('#' + id)).filter(Boolean);
      trRef.current.nodes(nodes);
      trRef.current.getLayer().batchDraw();
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
  }, [selectedIds, elements]);

  // Update ref whenever elements change
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Lazy mouse state
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [lazyPos, setLazyPos] = useState<Point>({ x: 0, y: 0 });
  const [laserTrails, setLaserTrails] = useState<{ id: string; strokeId: string; x: number; y: number; timestamp: number }[]>([]);
  const currentLaserStrokeId = useRef<string | null>(null);
  const pointsRef = useRef<number[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    const preventTouchZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    container.addEventListener('wheel', preventZoom, { passive: false });
    container.addEventListener('touchmove', preventTouchZoom, { passive: false });

    // Prevent default browser gestures on the whole container
    container.style.touchAction = 'none';

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('wheel', preventZoom);
      container.removeEventListener('touchmove', preventTouchZoom);
      resizeObserver.disconnect();
    };
  }, []);

  // Handle sidebar symbol clicks
  const lastProcessedSymbol = useRef<number>(0);

  useEffect(() => {
    if (pendingSymbol && pendingSymbol.timestamp !== lastProcessedSymbol.current) {
      lastProcessedSymbol.current = pendingSymbol.timestamp;
      const id = Math.random().toString(36).substring(7);
      
      let targetX = mousePos.x;
      let targetY = mousePos.y - (strokeWidth * 4);

      if (isMagnifierActiveRef.current && magnifierPosRef.current && magnifierSizeRef.current) {
        const stage = stageRef.current;
        if (stage) {
          const screenCenterX = magnifierPosRef.current.x + magnifierSizeRef.current.width / 2;
          const screenCenterY = magnifierPosRef.current.y + magnifierSizeRef.current.height / 2;
          const pos = { x: screenCenterX, y: screenCenterY };
          const transform = stage.getAbsoluteTransform().copy().invert();
          const adjustedPos = transform.point(pos);
          targetX = adjustedPos.x;
          targetY = adjustedPos.y - (strokeWidth * 4);
          
          // Pan the stage to the left (move content left, so pointer moves right)
          // The amount to pan is roughly the width of the character.
          // Let's say strokeWidth * 6 (since font size is strokeWidth * 4)
          const panAmount = strokeWidth * 6;
          const newPos = {
            x: stage.x() - panAmount * stage.scaleX(),
            y: stage.y()
          };
          stage.position(newPos);
          if (setMainStagePos) {
            setMainStagePos(newPos);
          }
        }
      }

      const newText: Element = {
        id,
        type: 'text',
        color: color,
        strokeWidth: strokeWidth,
        x: targetX,
        y: targetY,
        text: pendingSymbol.symbol,
      };
      
      const newElements = [...elementsRef.current, newText];
      setElements(newElements);
      addToHistory(newElements);
    }
  }, [pendingSymbol, color, strokeWidth, mousePos]);

  const magnifierPosRef = useRef(magnifierPos);
  const magnifierSizeRef = useRef(magnifierSize);
  const isMagnifierActiveRef = useRef(isMagnifierActive);

  useEffect(() => {
    magnifierPosRef.current = magnifierPos;
    magnifierSizeRef.current = magnifierSize;
    isMagnifierActiveRef.current = isMagnifierActive;
  }, [magnifierPos, magnifierSize, isMagnifierActive]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
        e.preventDefault();
        return;
      }

      // Number keys (0-9) and symbols
      const symbolMap: Record<string, string> = {
        's': '+',
        'r': '-',
        'x': '·',
        'c': '√'
      };

      if (/^[0-9]$/.test(e.key) || symbolMap[e.key]) {
        const textToInsert = symbolMap[e.key] || e.key;
        const id = Math.random().toString(36).substring(7);
        
        let targetX = mousePos.x;
        let targetY = mousePos.y - (strokeWidth * 4);

        if (isMagnifierActiveRef.current && magnifierPosRef.current && magnifierSizeRef.current) {
          const stage = stageRef.current;
          if (stage) {
            const screenCenterX = magnifierPosRef.current.x + magnifierSizeRef.current.width / 2;
            const screenCenterY = magnifierPosRef.current.y + magnifierSizeRef.current.height / 2;
            const pos = { x: screenCenterX, y: screenCenterY };
            const transform = stage.getAbsoluteTransform().copy().invert();
            const adjustedPos = transform.point(pos);
            targetX = adjustedPos.x;
            targetY = adjustedPos.y - (strokeWidth * 4);
            
            const panAmount = strokeWidth * 6;
            const newPos = {
              x: stage.x() - panAmount * stage.scaleX(),
              y: stage.y()
            };
            stage.position(newPos);
            if (setMainStagePos) {
              setMainStagePos(newPos);
            }
          }
        }

        const newText: Element = {
          id,
          type: 'text',
          color: color,
          strokeWidth: strokeWidth, // Store strokeWidth to use for font size
          x: targetX,
          y: targetY,
          text: textToInsert,
        };
        
        const newElements = [...elementsRef.current, newText];
        setElements(newElements);
        addToHistory(newElements);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, color, mousePos, strokeWidth]);

  useEffect(() => {
    const handleDownloadPDF = async () => {
      const stage = stageRef.current;
      if (!stage) return;

      try {
        const { jsPDF } = await import('jspdf');
        
        // Hide transformer for export
        const tr = trRef.current;
        if (tr) tr.hide();
        stage.batchDraw();

        const dataUrl = stage.toDataURL({ pixelRatio: 2 });
        
        const pdf = new jsPDF({
          orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [dimensions.width, dimensions.height]
        });

        pdf.addImage(dataUrl, 'PNG', 0, 0, dimensions.width, dimensions.height);
        pdf.save('whiteboard-export.pdf');

        if (tr) tr.show();
        stage.batchDraw();
      } catch (error) {
        console.error('Error al generar PDF:', error);
      }
    };

    window.addEventListener('download-pdf', handleDownloadPDF);
    return () => window.removeEventListener('download-pdf', handleDownloadPDF);
  }, [dimensions]);

  const handleMouseDown = (e: any) => {
    // Deselect if clicking on empty space
    if (e.target === e.target.getStage()) {
      setSelectedIds([]);
    }

    // If hand tool, we let Konva handle dragging
    if (tool === 'hand') return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Check for multi-touch (pinch zoom)
    if (e.evt.type === 'touchstart' && e.evt.touches && e.evt.touches.length > 1) {
      setIsDrawing(false);
      return;
    }

    const transform = stage.getAbsoluteTransform().copy().invert();
    const adjustedPos = transform.point(pos);

    setMousePos(adjustedPos);
    setLazyPos(adjustedPos);

    if (tool === 'scissors' || tool === 'crop-rect') {
      setSelectionRect({ x: adjustedPos.x, y: adjustedPos.y, width: 0, height: 0 });
      setSelectedIds([]);
      return;
    }

    if (tool === 'crop-free') {
      setIsDrawing(true);
      const id = Math.random().toString(36).substring(7);
      const newElement: Element = {
        id,
        type: 'pen', // Use pen for visual feedback, will be converted to crop later
        color: '#000000',
        strokeWidth: 2,
        points: [adjustedPos.x, adjustedPos.y, adjustedPos.x, adjustedPos.y],
      };
      setCurrentElement(newElement);
      pointsRef.current = [adjustedPos.x, adjustedPos.y, adjustedPos.x, adjustedPos.y];
      return;
    }

    if (tool === 'pointer') {
      const clickedOn = e.target;
      if (clickedOn !== stage) {
        const id = clickedOn.id();
        if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) {
          setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
        } else {
          setSelectedIds([id]);
        }
      }
      return;
    }

    setIsDrawing(true);
    const id = Math.random().toString(36).substring(7);

    if (tool === 'laser') {
      currentLaserStrokeId.current = id;
      return;
    }

    if (tool === 'pen' || tool === 'eraser') {
      const newElement: Element = {
        id,
        type: tool,
        color: tool === 'eraser' ? '#ffffff' : color,
        strokeWidth: tool === 'eraser' ? 20 : strokeWidth,
        points: [adjustedPos.x, adjustedPos.y, adjustedPos.x, adjustedPos.y],
      };
      setCurrentElement(newElement);
      pointsRef.current = [adjustedPos.x, adjustedPos.y, adjustedPos.x, adjustedPos.y];
    } else if (tool === 'line') {
      const newElement: Element = {
        id,
        type: 'line',
        color,
        strokeWidth,
        points: [adjustedPos.x, adjustedPos.y, adjustedPos.x, adjustedPos.y],
      };
      setCurrentElement(newElement);
    } else if (tool === 'rect') {
      const newElement: Element = {
        id,
        type: 'rect',
        color,
        strokeWidth,
        x: adjustedPos.x,
        y: adjustedPos.y,
        width: 0,
        height: 0,
      };
      setCurrentElement(newElement);
    } else if (tool === 'circle') {
      const newElement: Element = {
        id,
        type: 'circle',
        color,
        strokeWidth,
        x: adjustedPos.x,
        y: adjustedPos.y,
        radius: 0,
      };
      setCurrentElement(newElement);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setLaserTrails(prev => prev.filter(t => now - t.timestamp < 3000));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const adjustedPos = transform.point(pos);

    setMousePos(adjustedPos);

    if (tool === 'laser' && isDrawing && currentLaserStrokeId.current) {
      const newTrail = { id: Date.now().toString() + Math.random(), strokeId: currentLaserStrokeId.current, x: adjustedPos.x, y: adjustedPos.y, timestamp: Date.now() };
      setLaserTrails(prev => [...prev, newTrail]);
    }

    let targetPos = adjustedPos;
    if (lazyMode) {
      const lerp = lazyIntensity; 
      targetPos = {
        x: lazyPos.x + (adjustedPos.x - lazyPos.x) * lerp,
        y: lazyPos.y + (adjustedPos.y - lazyPos.y) * lerp,
      };
      setLazyPos(targetPos);
    }

    if (selectionRect) {
      setSelectionRect({
        ...selectionRect,
        width: targetPos.x - selectionRect.x,
        height: targetPos.y - selectionRect.y,
      });
      return;
    }

    if (!isDrawing || !currentElement) return;

    if (currentElement.type === 'pen' || currentElement.type === 'eraser') {
      const lastX = pointsRef.current[pointsRef.current.length - 2];
      const lastY = pointsRef.current[pointsRef.current.length - 1];
      const dist = Math.sqrt(Math.pow(targetPos.x - lastX, 2) + Math.pow(targetPos.y - lastY, 2));

      if (dist > 1) {
        const newPoints = [...pointsRef.current, targetPos.x, targetPos.y];
        pointsRef.current = newPoints;
        setCurrentElement({ ...currentElement, points: newPoints } as Element);
      }
    } else if (currentElement.type === 'line') {
      const points = [currentElement.points[0], currentElement.points[1], targetPos.x, targetPos.y];
      setCurrentElement({ ...currentElement, points } as Element);
    } else if (currentElement.type === 'rect') {
      const width = targetPos.x - currentElement.x;
      const height = targetPos.y - currentElement.y;
      setCurrentElement({ ...currentElement, width, height } as Element);
    } else if (currentElement.type === 'circle') {
      const radius = Math.sqrt(Math.pow(targetPos.x - currentElement.x, 2) + Math.pow(targetPos.y - currentElement.y, 2));
      setCurrentElement({ ...currentElement, radius } as Element);
    }
  };

  const handleDragStart = (e: any) => {
    const id = e.target.id();
    if (selectedIds.includes(id)) {
      const stage = stageRef.current;
      selectedIds.forEach(sid => {
        const node = stage.findOne('#' + sid);
        if (node) {
          dragStartPositions.current.set(sid, { x: node.x(), y: node.y() });
        }
      });
    }
  };

  const handleDragMove = (e: any) => {
    const id = e.target.id();
    if (selectedIds.includes(id)) {
      const startPos = dragStartPositions.current.get(id);
      if (startPos) {
        const dx = e.target.x() - startPos.x;
        const dy = e.target.y() - startPos.y;

        const stage = stageRef.current;
        selectedIds.forEach(sid => {
          if (sid !== id) {
            const node = stage.findOne('#' + sid);
            const sStartPos = dragStartPositions.current.get(sid);
            if (node && sStartPos) {
              node.x(sStartPos.x + dx);
              node.y(sStartPos.y + dy);
            }
          }
        });
      }
    }
  };

  const handleDragEnd = (e: any) => {
    const id = e.target.id();
    const stage = stageRef.current;
    
    let newElements = [...elements];
    
    if (selectedIds.includes(id)) {
      newElements = elements.map(el => {
        if (selectedIds.includes(el.id)) {
          const node = stage.findOne('#' + el.id);
          if (node) {
            const nx = node.x();
            const ny = node.y();
            
            if (el.type === 'pen' || el.type === 'eraser' || el.type === 'line') {
              const line = el as LineElement;
              const updatedPoints = line.points.map((p, i) => i % 2 === 0 ? p + nx : p + ny);
              node.x(0);
              node.y(0);
              return { ...line, points: updatedPoints };
            } else {
              const updatedEl = { ...el, x: (el as any).x + nx, y: (el as any).y + ny };
              node.x(0);
              node.y(0);
              return updatedEl as Element;
            }
          }
        }
        return el;
      });
      dragStartPositions.current.clear();
    } else {
      // Dragged a single element that wasn't selected
      const node = e.target;
      const nx = node.x();
      const ny = node.y();
      
      newElements = elements.map(item => {
        if (item.id === id) {
          if (item.type === 'pen' || item.type === 'eraser' || item.type === 'line') {
            const line = item as LineElement;
            const updatedPoints = line.points.map((p, i) => i % 2 === 0 ? p + nx : p + ny);
            node.x(0);
            node.y(0);
            return { ...line, points: updatedPoints };
          } else {
            const updatedEl = { ...item, x: (item as any).x + nx, y: (item as any).y + ny };
            node.x(0);
            node.y(0);
            return updatedEl as Element;
          }
        }
        return item;
      });
    }
    
    setElements(newElements);
    addToHistory(newElements);
  };

  const handleMouseUp = async () => {
    if (selectionRect) {
      if (tool === 'crop-rect') {
        // Capture the area
        const stage = stageRef.current;
        if (!stage) return;

        const rect = {
          x: Math.min(selectionRect.x, selectionRect.x + selectionRect.width),
          y: Math.min(selectionRect.y, selectionRect.y + selectionRect.height),
          width: Math.abs(selectionRect.width),
          height: Math.abs(selectionRect.height),
        };

        if (rect.width < 5 || rect.height < 5) {
          setSelectionRect(null);
          return;
        }

        // Hide selection rect for capture
        setSelectionRect(null);
        
        // Wait a tick for render
        setTimeout(() => {
          const dataUrl = stage.toDataURL({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            pixelRatio: 2
          });

          const id = Math.random().toString(36).substring(7);
          const newImage: Element = {
            id,
            type: 'image',
            x: rect.x + 20, // Offset slightly to show it's a copy
            y: rect.y + 20,
            width: rect.width,
            height: rect.height,
            src: dataUrl,
            color: '#000000',
            strokeWidth: 0
          };

          const newElements = [...elements, newImage];
          setElements(newElements);
          addToHistory(newElements);
          setSelectedIds([id]); // Select the new image
          if (setTool) setTool('pointer'); // Switch to pointer tool
        }, 0);
        return;
      }

      // Normal selection logic
      const rect = {
        x: Math.min(selectionRect.x, selectionRect.x + selectionRect.width),
        y: Math.min(selectionRect.y, selectionRect.y + selectionRect.height),
        width: Math.abs(selectionRect.width),
        height: Math.abs(selectionRect.height),
      };

      // Simple bounding box check for selection
      const elementsToSelect = elements.filter(el => {
        if ('x' in el && 'y' in el) {
          const ex = (el as any).x;
          const ey = (el as any).y;
          const ew = (el as any).width || 20;
          const eh = (el as any).height || 20;
          return ex >= rect.x && ey >= rect.y && (ex + ew) <= (rect.x + rect.width) && (ey + eh) <= (rect.y + rect.height);
        }
        if ('points' in el) {
          const points = (el as any).points;
          for (let i = 0; i < points.length; i += 2) {
            const px = points[i];
            const py = points[i + 1];
            if (px < rect.x || px > rect.x + rect.width || py < rect.y || py > rect.y + rect.height) {
              return false;
            }
          }
          return true;
        }
        return false;
      });

      if (elementsToSelect.length > 0) {
        setSelectedIds(elementsToSelect.map(el => el.id));
      }
      setSelectionRect(null);
      return;
    }

    if (tool === 'crop-free' && currentElement) {
      const stage = stageRef.current;
      if (!stage) return;

      // Calculate bounding box of the drawn path
      const points = (currentElement as any).points;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < points.length; i += 2) {
        minX = Math.min(minX, points[i]);
        minY = Math.min(minY, points[i + 1]);
        maxX = Math.max(maxX, points[i]);
        maxY = Math.max(maxY, points[i + 1]);
      }
      
      const width = maxX - minX;
      const height = maxY - minY;

      if (width < 5 || height < 5) {
        setIsDrawing(false);
        setCurrentElement(null);
        return;
      }

      // Hide the drawing path temporarily
      setCurrentElement(null);

      setTimeout(() => {
        // Capture the bounding box area
        const dataUrl = stage.toDataURL({
          x: minX,
          y: minY,
          width: width,
          height: height,
          pixelRatio: 2
        });

        // Create an offscreen canvas to mask the image
        const canvas = document.createElement('canvas');
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(2, 2);
          
          // Draw the mask shape
          ctx.beginPath();
          ctx.moveTo(points[0] - minX, points[1] - minY);
          for (let i = 2; i < points.length; i += 2) {
            ctx.lineTo(points[i] - minX, points[i + 1] - minY);
          }
          ctx.closePath();
          ctx.clip();

          // Draw the captured image
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            const maskedDataUrl = canvas.toDataURL();

            const id = Math.random().toString(36).substring(7);
            const newImage: Element = {
              id,
              type: 'image',
              x: minX + 20,
              y: minY + 20,
              width: width,
              height: height,
              src: maskedDataUrl,
              color: '#000000',
              strokeWidth: 0
            };

            const newElements = [...elements, newImage];
            setElements(newElements);
            addToHistory(newElements);
            setSelectedIds([id]);
            if (setTool) setTool('pointer'); // Switch to pointer tool
          };
          img.src = dataUrl;
        }
      }, 0);

      setIsDrawing(false);
      return;
    }

    if (tool === 'laser') {
      currentLaserStrokeId.current = null;
      setIsDrawing(false);
      return;
    }

    if (!currentElement) return;

    let finalElement = currentElement;

    // Smart Strokes Logic
    if (smartStrokes && currentElement.type === 'pen' && 'points' in currentElement) {
      const points = currentElement.points;
      if (points.length >= 6) {
        // Calculate bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0; i < points.length; i += 2) {
          minX = Math.min(minX, points[i]);
          minY = Math.min(minY, points[i + 1]);
          maxX = Math.max(maxX, points[i]);
          maxY = Math.max(maxY, points[i + 1]);
        }
        const width = maxX - minX;
        const height = maxY - minY;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Check if it's a closed loop
        const startX = points[0], startY = points[1];
        const endX = points[points.length - 2], endY = points[points.length - 1];
        const distStartEnd = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const isClosed = distStartEnd < Math.max(width, height) * 0.4;

        if (isClosed) {
          const aspectRatio = width / height;
          
          // Improved Corner Detection
          let corners: {x: number, y: number}[] = [];
          const step = Math.max(1, Math.floor(points.length / 40));
          for (let i = step * 2; i < points.length - step * 2; i += step * 2) {
             const p1 = { x: points[i - step * 2], y: points[i - step * 2 + 1] };
             const p2 = { x: points[i], y: points[i + 1] };
             const p3 = { x: points[i + step * 2], y: points[i + step * 2 + 1] };
             
             const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
             const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
             
             const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
             const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
             
             if (mag1 > 0 && mag2 > 0) {
                const dot = (v1.x * v2.x + v1.y * v2.y) / (mag1 * mag2);
                const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
                if (angle > 0.6) { // Significant turn
                   corners.push(p2);
                }
             }
          }

          // Filter close corners
          const filteredCorners = corners.filter((c, i) => {
             if (i === 0) return true;
             const prev = corners[i-1];
             const d = Math.sqrt(Math.pow(c.x - prev.x, 2) + Math.pow(c.y - prev.y, 2));
             return d > Math.max(width, height) * 0.15;
          });

          if (filteredCorners.length === 3) {
             // Triangle
             finalElement = {
               id: currentElement.id,
               type: 'line',
               color: currentElement.color,
               strokeWidth: currentElement.strokeWidth,
               points: [
                 filteredCorners[0].x, filteredCorners[0].y,
                 filteredCorners[1].x, filteredCorners[1].y,
                 filteredCorners[2].x, filteredCorners[2].y,
                 filteredCorners[0].x, filteredCorners[0].y
               ]
             };
          } else if (aspectRatio > 0.8 && aspectRatio < 1.2) {
            // Circle or Square
            let avgDist = 0;
            for (let i = 0; i < points.length; i += 2) {
              avgDist += Math.sqrt(Math.pow(points[i] - centerX, 2) + Math.pow(points[i + 1] - centerY, 2));
            }
            avgDist /= (points.length / 2);
            
            let variance = 0;
            for (let i = 0; i < points.length; i += 2) {
              const d = Math.sqrt(Math.pow(points[i] - centerX, 2) + Math.pow(points[i + 1] - centerY, 2));
              variance += Math.pow(d - avgDist, 2);
            }
            variance /= (points.length / 2);
            const stdDev = Math.sqrt(variance);

            if (stdDev < avgDist * 0.12) { // More strict for circle
              finalElement = {
                id: currentElement.id,
                type: 'circle',
                color: currentElement.color,
                strokeWidth: currentElement.strokeWidth,
                x: centerX,
                y: centerY,
                radius: (width + height) / 4
              };
            } else {
              // Check if it's a '0', '6', '8', or '9'
              if (stdDev < avgDist * 0.25) {
                let digit = '0';
                // Heuristic for 6, 8, 9 based on centroid of points relative to bounding box
                if (centerY > minY + height * 0.6) digit = '6';
                else if (centerY < minY + height * 0.4) digit = '9';
                else if (filteredCorners.length > 4) digit = '8';

                finalElement = {
                  id: currentElement.id,
                  type: 'text',
                  color: currentElement.color,
                  strokeWidth: Math.max(20, height / 1.5),
                  x: minX,
                  y: minY,
                  text: digit
                };
              } else {
                finalElement = {
                  id: currentElement.id,
                  type: 'rect',
                  color: currentElement.color,
                  strokeWidth: currentElement.strokeWidth,
                  x: minX,
                  y: minY,
                  width,
                  height
                };
              }
            }
          } else {
            // Oval or Rect
            finalElement = {
              id: currentElement.id,
              type: 'rect',
              color: currentElement.color,
              strokeWidth: currentElement.strokeWidth,
              x: minX,
              y: minY,
              width,
              height
            };
          }
        } else {
          // Open stroke - Digit recognition heuristics
          const startX = points[0], startY = points[1];
          const endX = points[points.length - 2], endY = points[points.length - 1];
          const midPointIdx = Math.floor(points.length / 4) * 2;
          const midY = points[midPointIdx + 1];
          
          const isVertical = height > width * 2.5;
          const isHorizontal = width > height * 2.5;

          // 1: Vertical-ish line
          if (isVertical && height > 30) {
            finalElement = {
              id: currentElement.id,
              type: 'text',
              color: currentElement.color,
              strokeWidth: Math.max(20, height / 1.5),
              x: minX,
              y: minY,
              text: '1'
            };
          } 
          // 7: Horizontal top then diagonal down
          else if (width > 20 && height > 20 && startX < centerX && startY < centerY && endX < centerX && endY > centerY) {
             finalElement = {
              id: currentElement.id,
              type: 'text',
              color: currentElement.color,
              strokeWidth: Math.max(20, height / 1.5),
              x: minX,
              y: minY,
              text: '7'
            };
          }
          // 2: Starts top left, curves right, then left, then right at bottom
          else if (width > 20 && height > 30 && startY < centerY && endY > centerY && endX > centerX) {
             finalElement = {
              id: currentElement.id,
              type: 'text',
              color: currentElement.color,
              strokeWidth: Math.max(20, height / 1.5),
              x: minX,
              y: minY,
              text: '2'
            };
          }
          // 3: Two rightward curves (starts top left, curves right, then mid, then right, then bottom left)
          else if (width > 20 && height > 30 && startX < centerX && endX < centerX && points.length > 20) {
             // Check if it crosses the mid line twice
             finalElement = {
              id: currentElement.id,
              type: 'text',
              color: currentElement.color,
              strokeWidth: Math.max(20, height / 1.5),
              x: minX,
              y: minY,
              text: '3'
            };
          }
          // 4: Usually two strokes, but if one: down, right, then vertical
          else if (width > 20 && height > 20 && startY < centerY && endY > centerY && midY > centerY) {
             finalElement = {
              id: currentElement.id,
              type: 'text',
              color: currentElement.color,
              strokeWidth: Math.max(20, height / 1.5),
              x: minX,
              y: minY,
              text: '4'
            };
          }
          // 5: Horizontal top, vertical down, then rightward curve
          else if (width > 20 && height > 30 && startX > centerX && endX < centerX) {
             finalElement = {
              id: currentElement.id,
              type: 'text',
              color: currentElement.color,
              strokeWidth: Math.max(20, height / 1.5),
              x: minX,
              y: minY,
              text: '5'
            };
          }
          // Default to straight line if it's mostly straight
          else {
            const totalDist = Math.sqrt(Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2));
            if (totalDist > 20) {
               finalElement = {
                 id: currentElement.id,
                 type: 'line',
                 color: currentElement.color,
                 strokeWidth: currentElement.strokeWidth,
                 points: [startX, startY, endX, endY]
               };
            }
          }
        }
      }
    }

    const newElements = [...elements, finalElement];
    setElements(newElements);
    addToHistory(newElements);

    setIsDrawing(false);
    setCurrentElement(null);
    pointsRef.current = [];
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // Handle touchpad pinch (ctrlKey is true for pinch on most touchpads)
    if (e.evt.ctrlKey) {
      // Pinch zoom
      const speed = 0.05;
      const newScale = oldScale * (1 - e.evt.deltaY * speed);
      const clampedScale = Math.max(0.1, Math.min(10, newScale));
      setZoom(clampedScale);

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };
      stage.position(newPos);
      if (setMainStagePos) setMainStagePos(newPos);
    } else {
      // Two-finger pan or normal wheel zoom
      // If the user is using a mouse wheel, deltaY is usually large (e.g. 100)
      // If the user is using a touchpad, deltaY/deltaX are usually small and continuous
      
      // If we are in 'hand' or 'pointer' mode, or if we detect touchpad-like small deltas, we pan
      // Actually, let's just pan if Shift is held OR if we are in hand/pointer mode and not drawing
      if (e.evt.shiftKey || tool === 'hand' || tool === 'pointer') {
        const newPos = {
          x: stage.x() - e.evt.deltaX,
          y: stage.y() - e.evt.deltaY,
        };
        stage.position(newPos);
        if (setMainStagePos) setMainStagePos(newPos);
      } else {
        // Normal wheel zoom
        const speed = 1.1;
        const newScale = e.evt.deltaY > 0 ? oldScale / speed : oldScale * speed;
        const clampedScale = Math.max(0.1, Math.min(10, newScale));
        setZoom(clampedScale);

        const newPos = {
          x: pointer.x - mousePointTo.x * clampedScale,
          y: pointer.y - mousePointTo.y * clampedScale,
        };
        stage.position(newPos);
        if (setMainStagePos) setMainStagePos(newPos);
      }
    }
  };

  const lastDist = useRef(0);
  const lastCenter = useRef<Point | null>(null);

  const handleTouchMove = (e: any) => {
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      const stage = stageRef.current;
      if (!stage) return;

      const p1 = { x: touch1.clientX, y: touch1.clientY };
      const p2 = { x: touch2.clientX, y: touch2.clientY };

      const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

      if (!lastDist.current || !lastCenter.current) {
        lastDist.current = dist;
        lastCenter.current = center;
        return;
      }

      const oldScale = stage.scaleX();
      const newScale = oldScale * (dist / lastDist.current);
      const clampedScale = Math.max(0.1, Math.min(10, newScale));

      setZoom(clampedScale);

      const mousePointTo = {
        x: (lastCenter.current.x - stage.x()) / oldScale,
        y: (lastCenter.current.y - stage.y()) / oldScale,
      };

      const newPos = {
        x: center.x - mousePointTo.x * clampedScale,
        y: center.y - mousePointTo.y * clampedScale,
      };

      stage.position(newPos);
      if (setMainStagePos) setMainStagePos(newPos);
      lastDist.current = dist;
      lastCenter.current = center;
    } else {
      handleMouseMove(e);
    }
  };

  const handleTouchEnd = () => {
    lastDist.current = 0;
    lastCenter.current = null;
    handleMouseUp();
  };

  const getPatternColor = () => {
    const isLight = backgroundColor === 'white' || backgroundColor === 'pink';
    return isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
  };

  const getBackgroundColor = () => {
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

  const getBackgroundClass = () => {
    switch (backgroundColor) {
      case 'steel': return 'metallic-steel';
      case 'charcoal': return 'metallic-charcoal';
      case 'green': return 'metallic-green';
      case 'navy': return 'metallic-navy';
      case 'bronze': return 'metallic-bronze';
      default: return '';
    }
  };

  const getPatternBounds = () => {
    if (!stageRef.current) return { startX: 0, endX: 2000, startY: 0, endY: 2000 };
    const stage = stageRef.current;
    const scale = stage.scaleX();
    const x = -stage.x() / scale;
    const y = -stage.y() / scale;
    const width = dimensions.width / scale;
    const height = dimensions.height / scale;

    return {
      startX: Math.floor(x / 40) * 40 - 40,
      endX: Math.ceil((x + width) / 40) * 40 + 40,
      startY: Math.floor(y / 40) * 40 - 40,
      endY: Math.ceil((y + height) / 40) * 40 + 40,
    };
  };

  const { startX, endX, startY, endY } = getPatternBounds();

  return (
    <div 
      ref={containerRef} 
      className={`canvas-container overflow-hidden relative w-full h-full ${getBackgroundClass()}`}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      {/* Animated Star Background (Static) */}
      {backgroundColor === 'space' && <GalaxyBackground />}

      {/* Mosaic Background */}
      {backgroundColor === 'mosaic' && <MosaicBackground />}

      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onDragMove={(e) => {
          if (e.target === stageRef.current && setMainStagePos) {
            setMainStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onDragEnd={(e) => {
          if (e.target === stageRef.current && setMainStagePos) {
            setMainStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
        ref={stageRef}
        scaleX={zoom}
        scaleY={zoom}
        draggable={tool === 'pointer' || tool === 'hand'}
      >
        <Layer>
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
                strokeWidth={2 / zoom}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                opacity={Math.max(0, 0.8 * (1 - age))}
                shadowColor="red"
                shadowBlur={10 / zoom}
                shadowOpacity={0.8}
              />
            );
          })}

          {/* Background Patterns Overlay */}
          {pattern === 'dots' && (
            <Group>
              {Array.from({ length: Math.ceil((endX - startX) / 40) + 1 }).map((_, i) => 
                Array.from({ length: Math.ceil((endY - startY) / 40) + 1 }).map((_, j) => (
                  <Circle
                    key={`dot-${i}-${j}`}
                    x={startX + i * 40}
                    y={startY + j * 40}
                    radius={1 / zoom}
                    fill={getPatternColor()}
                  />
                ))
              )}
            </Group>
          )}

          {pattern === 'grid' && (
            <Group>
              {Array.from({ length: Math.ceil((endX - startX) / 40) + 1 }).map((_, i) => (
                <Line
                  key={`vgrid-${i}`}
                  points={[startX + i * 40, startY, startX + i * 40, endY]}
                  stroke={getPatternColor()}
                  strokeWidth={1 / zoom}
                  opacity={0.5}
                />
              ))}
              {Array.from({ length: Math.ceil((endY - startY) / 40) + 1 }).map((_, i) => (
                <Line
                  key={`hgrid-${i}`}
                  points={[startX, startY + i * 40, endX, startY + i * 40]}
                  stroke={getPatternColor()}
                  strokeWidth={1 / zoom}
                  opacity={0.5}
                />
              ))}
            </Group>
          )}

          {pattern === 'lines' && (
            <Group>
              {Array.from({ length: Math.ceil((endY - startY) / 30) + 1 }).map((_, i) => (
                <Line
                  key={`line-${i}`}
                  points={[startX, startY + i * 30, endX, startY + i * 30]}
                  stroke={getPatternColor()}
                  strokeWidth={1 / zoom}
                  opacity={0.5}
                />
              ))}
            </Group>
          )}

          {backgroundColor === 'green' && (
            <Group opacity={0.1}>
              {/* Chalkboard texture simulation */}
              <Rect
                x={0}
                y={0}
                width={dimensions.width / zoom}
                height={dimensions.height / zoom}
                fillRadialGradientStartPoint={{ x: dimensions.width / (2 * zoom), y: dimensions.height / (2 * zoom) }}
                fillRadialGradientStartRadius={0}
                fillRadialGradientEndPoint={{ x: dimensions.width / (2 * zoom), y: dimensions.height / (2 * zoom) }}
                fillRadialGradientEndRadius={dimensions.width / zoom}
                fillRadialGradientColorStops={[0, 'transparent', 1, 'black']}
              />
            </Group>
          )}

          {/* Selection Marquee */}
          {selectionRect && (
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              stroke="#3b82f6"
              strokeWidth={1 / zoom}
              dash={[5, 5]}
            />
          )}

          {elements.map((el) => {
            if (el.type === 'pen' || el.type === 'eraser' || el.type === 'line') {
              return (
                <Line
                  key={el.id}
                  id={el.id}
                  points={el.points}
                  stroke={el.color}
                  strokeWidth={el.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  draggable={tool === 'pointer' || tool === 'scissors'}
                  globalCompositeOperation={el.type === 'eraser' ? 'destination-out' : 'source-over'}
                  shadowColor={NEON_COLORS.includes(el.color) ? el.color : undefined}
                  shadowBlur={NEON_COLORS.includes(el.color) ? 15 : 0}
                  shadowOpacity={NEON_COLORS.includes(el.color) ? 0.8 : 0}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    const newElements = elements.map(item => {
                      if (item.id === el.id) {
                        const line = item as any;
                        return {
                          ...line,
                          points: line.points.map((p: number, i: number) => i % 2 === 0 ? p * scaleX : p * scaleY),
                          rotation: node.rotation()
                        };
                      }
                      return item;
                    });
                    setElements(newElements);
                    addToHistory(newElements);
                  }}
                />
              );
            } else if (el.type === 'rect') {
              return (
                <Rect
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  stroke={el.color}
                  strokeWidth={el.strokeWidth}
                  draggable={tool === 'pointer' || tool === 'scissors'}
                  shadowColor={NEON_COLORS.includes(el.color) ? el.color : undefined}
                  shadowBlur={NEON_COLORS.includes(el.color) ? 15 : 0}
                  shadowOpacity={NEON_COLORS.includes(el.color) ? 0.8 : 0}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    const newElements = elements.map(item => {
                      if (item.id === el.id) {
                        return {
                          ...item,
                          x: node.x(),
                          y: node.y(),
                          width: Math.max(5, (item as any).width * scaleX),
                          height: Math.max(5, (item as any).height * scaleY),
                          rotation: node.rotation()
                        };
                      }
                      return item;
                    });
                    setElements(newElements);
                    addToHistory(newElements);
                  }}
                />
              );
            } else if (el.type === 'circle') {
              return (
                <Circle
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  radius={el.radius}
                  stroke={el.color}
                  strokeWidth={el.strokeWidth}
                  draggable={tool === 'pointer' || tool === 'scissors'}
                  shadowColor={NEON_COLORS.includes(el.color) ? el.color : undefined}
                  shadowBlur={NEON_COLORS.includes(el.color) ? 15 : 0}
                  shadowOpacity={NEON_COLORS.includes(el.color) ? 0.8 : 0}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    node.scaleX(1);
                    node.scaleY(1);
                    const newElements = elements.map(item => {
                      if (item.id === el.id) {
                        return {
                          ...item,
                          x: node.x(),
                          y: node.y(),
                          radius: Math.max(5, (item as any).radius * scaleX),
                          rotation: node.rotation()
                        };
                      }
                      return item;
                    });
                    setElements(newElements);
                    addToHistory(newElements);
                  }}
                />
              );
            } else if (el.type === 'text') {
              return (
                <Text
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  text={el.text}
                  fontSize={el.strokeWidth * 8} // Scale font size with strokeWidth
                  fill={el.color}
                  fontFamily="Inter"
                  fontStyle="bold"
                  draggable={tool === 'pointer' || tool === 'scissors'}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                />
              );
            } else if (el.type === 'image') {
              const imageEl = el as ImageElement;
              return (
                <URLImage
                  key={el.id}
                  id={el.id}
                  src={imageEl.src}
                  x={imageEl.x}
                  y={imageEl.y}
                  width={imageEl.width}
                  height={imageEl.height}
                  isSelected={selectedIds.includes(el.id)}
                  onSelect={(e: any) => {
                    if (tool === 'pointer' || tool === 'scissors') {
                      const id = el.id;
                      if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) {
                        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
                      } else {
                        setSelectedIds([id]);
                      }
                    }
                  }}
                  onChange={(newAttrs: any) => {
                    const newElements = elements.map((item) => {
                      if (item.id === el.id) {
                        return { ...item, ...newAttrs };
                      }
                      return item;
                    });
                    setElements(newElements);
                    addToHistory(newElements);
                  }}
                />
              );
            }
            return null;
          })}

          {currentElement && (
            <>
              {currentElement.type === 'pen' || currentElement.type === 'eraser' || currentElement.type === 'line' ? (
                <Line
                  points={currentElement.points}
                  stroke={currentElement.color}
                  strokeWidth={currentElement.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={currentElement.type === 'eraser' ? 'destination-out' : 'source-over'}
                />
              ) : currentElement.type === 'rect' ? (
                <Rect
                  x={currentElement.x}
                  y={currentElement.y}
                  width={currentElement.width}
                  height={currentElement.height}
                  stroke={currentElement.color}
                  strokeWidth={currentElement.strokeWidth}
                />
              ) : currentElement.type === 'circle' ? (
                <Circle
                  x={currentElement.x}
                  y={currentElement.y}
                  radius={currentElement.radius}
                  stroke={currentElement.color}
                  strokeWidth={currentElement.strokeWidth}
                />
              ) : null}
            </>
          )}

          {/* Mobile Pointer Cursor */}
          {tool === 'pointer' && (
            <Group x={mousePos.x} y={mousePos.y}>
              <Circle
                radius={10}
                stroke="#000"
                strokeWidth={1}
                dash={[2, 2]}
              />
              <Line
                points={[-15, 0, 15, 0]}
                stroke="#000"
                strokeWidth={1}
              />
              <Line
                points={[0, -15, 0, 15]}
                stroke="#000"
                strokeWidth={1}
              />
              <Circle
                radius={2}
                fill="#000"
              />
            </Group>
          )}

          {/* Global Transformer */}
          {selectedIds.length > 0 && (
            <Transformer
              ref={trRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};
