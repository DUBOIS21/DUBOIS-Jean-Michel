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

        const resizeCanvas = () => {
          // La taille CSS du canevas correspond maintenant à la taille affichée de l'image grâce à la disposition en grille.
          // Il suffit de définir la résolution interne du canevas pour qu'elle corresponde.
          const { width, height } = image.getBoundingClientRect();
          canvas.width = width;
          canvas.height = height;
        };
        
        image.onload = resizeCanvas;
        
        // Utiliser un ResizeObserver pour gérer le redimensionnement de la fenêtre et s'assurer que le canevas reste synchronisé
        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(image);
        
        // Si l'image est déjà chargée, déclencher le redimensionnement manuellement
        if (image.complete) {
            resizeCanvas();
        }

        return () => {
            resizeObserver.unobserve(image);
        };
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
      context.strokeStyle = 'rgba(255, 0, 150, 0.6)'; // Rose vif avec un peu de transparence
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
      // Utiliser naturalWidth/Height pour la pleine résolution
      tempCanvas.width = image.naturalWidth;
      tempCanvas.height = image.naturalHeight;
      const ctx = tempCanvas.getContext('2d');
      
      if (!ctx) return null;
      
      // Dessiner l'image originale en pleine résolution
      ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
      
      // Dessiner le canevas du masque, en le redimensionnant pour correspondre à la résolution de l'image originale
      ctx.drawImage(maskCanvas, 0, 0, image.naturalWidth, image.naturalHeight);
      
      return tempCanvas.toDataURL('image/png');
    },
  }));

  return (
    <div className="w-full h-full grid place-items-center">
      <img
        ref={imageRef}
        src={src}
        alt="Original pour édition"
        className="[grid-area:1/1] max-w-full max-h-full object-contain pointer-events-none rounded-lg"
        crossOrigin="anonymous" 
      />
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onMouseMove={draw}
        className="[grid-area:1/1] cursor-crosshair"
      />
    </div>
  );
});

export default MaskableImage;
