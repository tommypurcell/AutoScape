import React, { useRef, useEffect, useState, useCallback } from 'react';

interface EditModeCanvasProps {
  imageUrl: string;
  onSave: (annotatedImage: string, annotations: Annotation[]) => void;
  onCancel: () => void;
}

export interface Annotation {
  type: 'circle' | 'pen';
  x: number;
  y: number;
  radius?: number;
  path?: { x: number; y: number }[];
  description: string;
  color: string;
}

export const EditModeCanvas: React.FC<EditModeCanvasProps> = ({
  imageUrl,
  onSave,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'circle'>('pen');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [circleStart, setCircleStart] = useState<{ x: number; y: number } | null>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [pendingAnnotation, setPendingAnnotation] = useState<Partial<Annotation> | null>(null);
  const [descriptionInput, setDescriptionInput] = useState('');

  // Load image and draw it on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match image aspect ratio but fit container
      const container = canvas.parentElement;
      if (container) {
        const maxWidth = container.clientWidth;
        const maxHeight = container.clientHeight;
        const imgAspect = img.width / img.height;
        const containerAspect = maxWidth / maxHeight;

        let canvasWidth, canvasHeight;
        if (imgAspect > containerAspect) {
          canvasWidth = maxWidth;
          canvasHeight = maxWidth / imgAspect;
        } else {
          canvasHeight = maxHeight;
          canvasWidth = maxHeight * imgAspect;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      redrawAnnotations();
    };

    img.src = imageUrl;
  }, [imageUrl]);

  // Redraw all annotations
  const redrawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw image
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // Redraw all annotations
    annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (annotation.type === 'circle' && annotation.radius !== undefined) {
        ctx.beginPath();
        ctx.arc(annotation.x, annotation.y, annotation.radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (annotation.type === 'pen' && annotation.path) {
        ctx.beginPath();
        annotation.path.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      }
    });
  }, [annotations]);

  useEffect(() => {
    redrawAnnotations();
  }, [redrawAnnotations]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'pen') {
      setIsDrawing(true);
      const coords = getCoordinates(e);
      setCurrentPath([coords]);
    } else if (tool === 'circle') {
      const coords = getCoordinates(e);
      setCircleStart(coords);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isDrawing && tool === 'pen') {
      const coords = getCoordinates(e);
      setCurrentPath((prev) => [...prev, coords]);

      // Draw current path
      redrawAnnotations();
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      currentPath.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (circleStart && tool === 'circle') {
      const coords = getCoordinates(e);
      const radius = Math.sqrt(
        Math.pow(coords.x - circleStart.x, 2) + Math.pow(coords.y - circleStart.y, 2)
      );

      // Redraw and show preview
      redrawAnnotations();
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(circleStart.x, circleStart.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing && tool === 'pen') {
      setIsDrawing(false);
      if (currentPath.length > 0) {
        // Prompt for description
        setPendingAnnotation({
          type: 'pen',
          path: [...currentPath],
          color: '#ff0000',
        });
        setShowDescriptionModal(true);
      }
      setCurrentPath([]);
    } else if (circleStart && tool === 'circle') {
      const coords = getCoordinates(e);
      const radius = Math.sqrt(
        Math.pow(coords.x - circleStart.x, 2) + Math.pow(coords.y - circleStart.y, 2)
      );

      if (radius > 5) {
        // Only save if circle is meaningful size
        setPendingAnnotation({
          type: 'circle',
          x: circleStart.x,
          y: circleStart.y,
          radius,
          color: '#ff0000',
        });
        setShowDescriptionModal(true);
      }
      setCircleStart(null);
    }
  };

  const handleSaveAnnotation = () => {
    if (!pendingAnnotation || !descriptionInput.trim()) return;

    const newAnnotation: Annotation = {
      ...pendingAnnotation,
      description: descriptionInput.trim(),
    } as Annotation;

    setAnnotations((prev) => [...prev, newAnnotation]);
    setPendingAnnotation(null);
    setDescriptionInput('');
    setShowDescriptionModal(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const annotatedImage = canvas.toDataURL('image/png');
    onSave(annotatedImage, annotations);
  };

  const handleClear = () => {
    setAnnotations([]);
    redrawAnnotations();
  };

  return (
    <div className="relative w-full h-full bg-slate-900 flex flex-col">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 flex items-center gap-3">
        <button
          onClick={() => setTool('pen')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            tool === 'pen'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Pen
        </button>
        <button
          onClick={() => setTool('circle')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            tool === 'circle'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Circle
        </button>
        <div className="w-px h-6 bg-slate-300 mx-2" />
        <button
          onClick={handleClear}
          className="px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
        >
          Clear All
        </button>
        <div className="w-px h-6 bg-slate-300 mx-2" />
        <button
          onClick={handleSave}
          disabled={annotations.length === 0}
          className="px-4 py-2 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
        >
          Apply Changes
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="max-w-full max-h-full cursor-crosshair border-2 border-slate-700 rounded-lg shadow-2xl"
        />
      </div>

      {/* Annotations List */}
      {annotations.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-h-32 overflow-y-auto">
          <div className="text-sm font-semibold text-slate-700 mb-2">
            Annotations ({annotations.length}):
          </div>
          <div className="flex flex-wrap gap-2">
            {annotations.map((ann, idx) => (
              <div
                key={idx}
                className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium"
              >
                {ann.type === 'circle' ? '⭕' : '✏️'} {ann.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              Describe the Change
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              What would you like to change in this area?
            </p>
            <textarea
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder="e.g., Replace the grass with a stone patio, Add a fire pit here, Change to Japanese maple trees..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDescriptionModal(false);
                  setPendingAnnotation(null);
                  setDescriptionInput('');
                }}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAnnotation}
                disabled={!descriptionInput.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

