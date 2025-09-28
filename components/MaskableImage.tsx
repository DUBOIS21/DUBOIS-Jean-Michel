
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

interface MaskableImageProps {
  src: string;
  brushSize?: number;
}

const MaskableImage = forwardRef<{ getImageWithMask: () => string | null }, MaskableImageProps>(({ src, brushSize = 20 }, ref) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (canvas && image) {
      const context = canvas.getContext('2d');
      if (context) {
        // Clear canvas when src changes
        context.clearRect(0, 0, canvas.width, canvas.height);

        image.onload = () => {
          // Match canvas dimensions to the image's container-fitted size
          const { width, height } = image.getBoundingClientRect();
          canvas.width = width;
          canvas.height = height;
        };
        // If image is already loaded, trigger onload manually
        if (image.complete) {
            image.onload(new Event('load'));
        }
      }
    }
  }, [src]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const context = canvasRef.current?.getContext('2d');
    if (context) {
        context.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const context = canvasRef.current?.getContext('2d');
    const { x, y } = getMousePos(e);
    if (context) {
      context.lineWidth = brushSize;
      context.lineCap = 'round';
      context.strokeStyle = 'rgba(255, 0, 150, 0.6)'; // Bright pink with some transparency
      context.lineTo(x, y);
      context.stroke();
      context.beginPath();
      context.moveTo(x, y);
    }
  };

  useImperativeHandle(ref, () => ({
    getImageWithMask: () => {
      const image = imageRef.current;
      const maskCanvas = canvasRef.current;
      if (!image || !maskCanvas) return null;

      const tempCanvas = document.createElement('canvas');
      // Use naturalWidth/Height for full resolution
      tempCanvas.width = image.naturalWidth;
      tempCanvas.height = image.naturalHeight;
      const ctx = tempCanvas.getContext('2d');
      
      if (!ctx) return null;
      
      // Draw original image at full resolution
      ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
      
      // Draw mask canvas, scaling it to match the original image resolution
      ctx.drawImage(maskCanvas, 0, 0, image.naturalWidth, image.naturalHeight);
      
      return tempCanvas.toDataURL('image/png');
    },
  }));

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <img
        ref={imageRef}
        src={src}
        alt="Original pour édition"
        className="max-w-full max-h-full object-contain pointer-events-none rounded-lg"
        crossOrigin="anonymous" 
      />
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onMouseMove={draw}
        className="absolute top-0 left-0 w-full h-full cursor-crosshair"
      />
    </div>
  );
});

export default MaskableImage;
   