import React, { useState, useCallback, useEffect } from 'react';
import { Whiteboard } from './components/Whiteboard';
import { Toolbar } from './components/Toolbar';
import { TopToolbar } from './components/TopToolbar';
import { SymbolSidebar } from './components/SymbolSidebar';
import { Magnifier } from './components/Magnifier';
import { UndoRedoControls } from './components/UndoRedoControls';
import { Tool, Element, BackgroundColor, PatternType } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

export default function App() {
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [elements, setElements] = useState<Element[]>([]);
  const [history, setHistory] = useState<Element[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [lazyMode, setLazyMode] = useState(true);
  const [lazyIntensity, setLazyIntensity] = useState(0.1);
  const [backgroundColor, setBackgroundColor] = useState<BackgroundColor>('white');
  const [pattern, setPattern] = useState<PatternType>('none');
  const [zoom, setZoom] = useState(1);
  const [pendingSymbol, setPendingSymbol] = useState<{ symbol: string; timestamp: number } | null>(null);
  const [smartStrokes, setSmartStrokes] = useState(false);
  const [isMagnifierActive, setIsMagnifierActive] = useState(false);
  const [mainStagePos, setMainStagePos] = useState({ x: 0, y: 0 });
  const [magnifierPos, setMagnifierPos] = useState({ x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 100 });
  const [magnifierSize, setMagnifierSize] = useState({ width: 300, height: 200 });
  const [showSymbolMenu, setShowSymbolMenu] = useState(false);

  // Multi-page state
  const [pages, setPages] = useState<Element[][]>([[]]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setMagnifierPos(prev => {
        const maxX = window.innerWidth - magnifierSize.width;
        const maxY = window.innerHeight - magnifierSize.height;
        return {
          x: Math.min(Math.max(0, prev.x), maxX),
          y: Math.min(Math.max(0, prev.y), maxY)
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [magnifierSize]);

  // Load from localStorage
  useEffect(() => {
    console.log('Pizarra: App montada, cargando datos...');
    try {
      const savedPages = localStorage.getItem('whiteboard_pages');
      const savedPageIndex = localStorage.getItem('whiteboard_current_page');
      const savedBg = localStorage.getItem('whiteboard_bg');
      const savedPattern = localStorage.getItem('whiteboard_pattern');

      if (savedPages) {
        const parsedPages = JSON.parse(savedPages);
        if (Array.isArray(parsedPages)) {
          setPages(parsedPages);
          const index = savedPageIndex ? parseInt(savedPageIndex, 10) : 0;
          setCurrentPageIndex(index);
          if (parsedPages[index]) {
            setElements(parsedPages[index]);
            setHistory([parsedPages[index]]);
            setHistoryIndex(0);
          }
        }
      }
      if (savedBg) setBackgroundColor(savedBg as BackgroundColor);
      if (savedPattern) setPattern(savedPattern as PatternType);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (pages.length > 0) {
      localStorage.setItem('whiteboard_pages', JSON.stringify(pages));
      localStorage.setItem('whiteboard_current_page', currentPageIndex.toString());
      localStorage.setItem('whiteboard_bg', backgroundColor);
      localStorage.setItem('whiteboard_pattern', pattern);
    }
  }, [pages, currentPageIndex, backgroundColor, pattern]);

  const addToHistory = useCallback((newElements: Element[]) => {
    // Update current page in pages array
    const newPages = [...pages];
    newPages[currentPageIndex] = [...newElements];
    setPages(newPages);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, pages, currentPageIndex]);

  const handleAddPage = useCallback(() => {
    const newPages = [...pages];
    newPages[currentPageIndex] = [...elements]; // Save current
    const updatedPages = [...newPages, []];
    setPages(updatedPages);
    setCurrentPageIndex(updatedPages.length - 1);
    setElements([]);
    setHistory([[]]);
    setHistoryIndex(0);
  }, [pages, currentPageIndex, elements]);

  const handlePrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      const newPages = [...pages];
      newPages[currentPageIndex] = [...elements]; // Save current
      setPages(newPages);
      
      const prevIndex = currentPageIndex - 1;
      setCurrentPageIndex(prevIndex);
      setElements(newPages[prevIndex]);
      setHistory([newPages[prevIndex]]);
      setHistoryIndex(0);
    }
  }, [pages, currentPageIndex, elements]);

  const handleNextPage = useCallback(() => {
    if (currentPageIndex < pages.length - 1) {
      const newPages = [...pages];
      newPages[currentPageIndex] = [...elements]; // Save current
      setPages(newPages);

      const nextIndex = currentPageIndex + 1;
      setCurrentPageIndex(nextIndex);
      setElements(newPages[nextIndex]);
      setHistory([newPages[nextIndex]]);
      setHistoryIndex(0);
    }
  }, [pages, currentPageIndex, elements]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleClear = useCallback(() => {
    setElements([]);
    addToHistory([]);
  }, [addToHistory]);

  const handleSymbolClick = useCallback((symbol: string) => {
    setPendingSymbol({ symbol, timestamp: Date.now() });
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        const id = Math.random().toString(36).substring(7);
        const newImage: Element = {
          id,
          type: 'image',
          color: '#000000',
          strokeWidth: 1,
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          src,
        };
        const newElements = [...elements, newImage];
        setElements(newElements);
        addToHistory(newElements);
      };
      reader.readAsDataURL(file);
    }
  }, [elements, addToHistory]);

  const handleAddSticker = useCallback((sticker: string) => {
    const id = Math.random().toString(36).substring(7);
    const newSticker: Element = {
      id,
      type: 'text',
      color: '#000000',
      strokeWidth: 10, // Default size for stickers
      x: 150,
      y: 150,
      text: sticker,
    };
    const newElements = [...elements, newSticker];
    setElements(newElements);
    addToHistory(newElements);
  }, [elements, addToHistory]);

  const handleDownloadPDF = useCallback(() => {
    // We'll use a ref to the stage in Whiteboard.tsx
    // But since we are in App.tsx, we can trigger it via a custom event or a prop
    const event = new CustomEvent('download-pdf');
    window.dispatchEvent(event);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-zinc-50 font-sans overflow-hidden">
      {/* Main Whiteboard Area */}
      <main className="w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key="whiteboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Whiteboard
              tool={tool}
              color={color}
              strokeWidth={strokeWidth}
              elements={elements}
              setElements={setElements}
              addToHistory={addToHistory}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              lazyMode={lazyMode}
              lazyIntensity={lazyIntensity}
              backgroundColor={backgroundColor}
              pattern={pattern}
              zoom={zoom}
              setZoom={setZoom}
              pendingSymbol={pendingSymbol}
              smartStrokes={smartStrokes}
              setMainStagePos={setMainStagePos}
              isMagnifierActive={isMagnifierActive}
              magnifierPos={magnifierPos}
              magnifierSize={magnifierSize}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Top Toolbar */}
      <TopToolbar 
        tool={tool}
        setTool={setTool}
        onAddPage={handleAddPage}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        currentPage={currentPageIndex + 1}
        totalPages={pages.length}
        zoom={zoom}
        setZoom={setZoom}
        isMagnifierActive={isMagnifierActive}
        setIsMagnifierActive={setIsMagnifierActive}
      />

      {/* Magnifier */}
      {isMagnifierActive && (
        <Magnifier
          elements={elements}
          setElements={setElements}
          addToHistory={addToHistory}
          backgroundColor={backgroundColor}
          pattern={pattern}
          mainStagePos={mainStagePos}
          mainStageScale={zoom}
          onClose={() => setIsMagnifierActive(false)}
          lazyMode={lazyMode}
          lazyIntensity={lazyIntensity}
          tool={tool}
          color={color}
          strokeWidth={strokeWidth}
          pos={magnifierPos}
          setPos={setMagnifierPos}
          size={magnifierSize}
          setSize={setMagnifierSize}
        />
      )}

      {/* Bottom Sidebars */}
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        onClear={handleClear}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        lazyMode={lazyMode}
        setLazyMode={setLazyMode}
        lazyIntensity={lazyIntensity}
        setLazyIntensity={setLazyIntensity}
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
        pattern={pattern}
        setPattern={setPattern}
        zoom={zoom}
        setZoom={setZoom}
        onImageUpload={handleImageUpload}
        onAddSticker={handleAddSticker}
        smartStrokes={smartStrokes}
        setSmartStrokes={setSmartStrokes}
        onDownloadPDF={handleDownloadPDF}
        showSymbolMenu={showSymbolMenu}
        setShowSymbolMenu={setShowSymbolMenu}
      />

      <SymbolSidebar 
        onSymbolClick={handleSymbolClick}
        color={color}
        strokeWidth={strokeWidth}
        isVisible={showSymbolMenu}
      />

      <UndoRedoControls
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
    </div>
  );
}
