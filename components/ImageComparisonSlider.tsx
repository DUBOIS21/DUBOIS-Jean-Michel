import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageComparisonSliderProps {
  beforeSrc: string;
  afterSrc: string;
}

const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({ beforeSrc, afterSrc }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);
  
  const handleTouchStart = () => {
    setIsDragging(true);
  };
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchcancel', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchcancel', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove]);


  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square cursor-ew-resize select-none overflow-hidden rounded-xl shadow-lg"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <img
        src={afterSrc}
        alt="Après modification"
        className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
        draggable="false"
      />
      <div
        className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforeSrc}
          alt="Avant modification"
          className="w-full h-full object-contain"
          draggable="false"
        />
      </div>
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/70 backdrop-blur-sm pointer-events-none"
        style={{ left: `calc(${sliderPosition}%)` }}
      >
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white/80 rounded-full shadow-lg border-2 border-white flex items-center justify-center backdrop-blur-sm cursor-ew-resize"
        >
          <svg className="w-6 h-6 text-bunker-800 rotate-90" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </div>
       <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md pointer-events-none">Avant</div>
       <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md pointer-events-none">Après</div>
    </div>
  );
};

export default ImageComparisonSlider;
