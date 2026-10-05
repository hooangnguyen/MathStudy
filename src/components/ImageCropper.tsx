import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, Check, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedImageDataUrl: string) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCrop, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  const CROP_SIZE = 280;
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      setImageLoaded(true);
      // Center the image initially
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imageElement) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

    // Save context
    ctx.save();

    // Move to center
    ctx.translate(CROP_SIZE / 2, CROP_SIZE / 2);

    // Apply transformations
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(position.x, position.y);

    // Calculate aspect ratio to fill the circle
    const imgAspect = imageElement.width / imageElement.height;
    let drawWidth = CROP_SIZE * 1.5;
    let drawHeight = CROP_SIZE * 1.5;

    if (imgAspect > 1) {
      drawHeight = drawWidth / imgAspect;
    } else {
      drawWidth = drawHeight * imgAspect;
    }

    // Draw image
    ctx.drawImage(imageElement, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    // Restore context
    ctx.restore();
  }, [imageLoaded, imageElement, scale, position, rotation]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta)));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleCrop = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    onCrop(dataUrl);
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/95 z-[200] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900/50">
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
          <h2 className="text-lg font-black text-white">Chỉnh sửa ảnh</h2>
          <button
            onClick={handleCrop}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
          >
            <Check size={20} />
          </button>
        </div>

        {/* Canvas Container */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center p-4 overflow-hidden cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          <div
            className="relative"
            style={{ width: CROP_SIZE, height: CROP_SIZE }}
          >
            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={CROP_SIZE}
              height={CROP_SIZE}
              className="rounded-full shadow-2xl"
            />

            {/* Crop overlay */}
            <div className="absolute inset-0 rounded-full border-4 border-white/50 pointer-events-none" />

            {/* Drag indicator */}
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                <Move className="text-white/70" size={32} />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 bg-slate-900/50 space-y-4">
          {/* Zoom Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleZoom(-0.2)}
              className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 transition-colors"
            >
              <ZoomOut size={20} />
            </button>
            <div className="flex-1 max-w-[200px]">
              <input
                type="range"
                min={MIN_SCALE}
                max={MAX_SCALE}
                step={0.1}
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>
            <button
              onClick={() => handleZoom(0.2)}
              className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 transition-colors"
            >
              <ZoomIn size={20} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Đặt lại
            </button>
            <button
              onClick={handleRotate}
              className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Xoay 90°
            </button>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleCrop}
            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-black rounded-2xl shadow-xl hover:opacity-90 transition-opacity"
          >
            Áp dụng
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
