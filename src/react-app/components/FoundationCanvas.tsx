import { useRef, useEffect, useState, useCallback } from "react";
import { Undo, Redo, Download, Trash2 } from "lucide-react";
import { PierPlacement, PierPlacements } from "@/shared/types";
import PierPlacementModal from "./PierPlacementModal";

interface FoundationCanvasProps {
  pierPlacements: PierPlacements;
  onPierPlacementChange: (placements: PierPlacements) => void;
  blueprint?: string;
  editable?: boolean;
  className?: string;
}

interface CanvasState {
  placements: PierPlacements;
  timestamp: number;
}

export default function FoundationCanvas({
  pierPlacements,
  onPierPlacementChange,
  blueprint,
  editable = true,
  className = ""
}: FoundationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blueprintImageRef = useRef<HTMLImageElement>(null);
  
  const [selectedPierType, setSelectedPierType] = useState<PierPlacement["type"]>("push_pier");
  const [selectedPier, setSelectedPier] = useState<string | null>(null);
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [scale, setScale] = useState(1);
  const [pan] = useState({ x: 0, y: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [pendingPierLocation, setPendingPierLocation] = useState<{ x: number; y: number } | null>(null);
  
  // Foundation dimensions (in feet)
  const FOUNDATION_WIDTH = 40;
  const FOUNDATION_HEIGHT = 30;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  
  // Convert foundation coordinates to canvas coordinates
  const foundationToCanvas = useCallback((x: number, y: number) => {
    const canvasX = (x + FOUNDATION_WIDTH / 2) * (CANVAS_WIDTH / FOUNDATION_WIDTH) * scale + pan.x;
    const canvasY = (y + FOUNDATION_HEIGHT / 2) * (CANVAS_HEIGHT / FOUNDATION_HEIGHT) * scale + pan.y;
    return { x: canvasX, y: canvasY };
  }, [scale, pan.x, pan.y]);
  
  // Convert canvas coordinates to foundation coordinates
  const canvasToFoundation = useCallback((x: number, y: number) => {
    const foundationX = ((x - pan.x) / scale) * (FOUNDATION_WIDTH / CANVAS_WIDTH) - FOUNDATION_WIDTH / 2;
    const foundationY = ((y - pan.y) / scale) * (FOUNDATION_HEIGHT / CANVAS_HEIGHT) - FOUNDATION_HEIGHT / 2;
    return { x: foundationX, y: foundationY };
  }, [scale, pan.x, pan.y]);
  
  // Save state to history
  const saveToHistory = useCallback((placements: PierPlacements) => {
    const newState: CanvasState = {
      placements: [...placements],
      timestamp: Date.now()
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);
  
  // Undo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onPierPlacementChange(previousState.placements);
    }
  }, [history, historyIndex, onPierPlacementChange]);
  
  // Redo functionality
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onPierPlacementChange(nextState.placements);
    }
  }, [history, historyIndex, onPierPlacementChange]);
  
  // Draw foundation outline
  const drawFoundation = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "#8B4513";
    ctx.lineWidth = 3;
    ctx.fillStyle = "#F5DEB3";
    
    const topLeft = foundationToCanvas(-FOUNDATION_WIDTH / 2, -FOUNDATION_HEIGHT / 2);
    const width = FOUNDATION_WIDTH * (CANVAS_WIDTH / FOUNDATION_WIDTH) * scale;
    const height = FOUNDATION_HEIGHT * (CANVAS_HEIGHT / FOUNDATION_HEIGHT) * scale;
    
    ctx.fillRect(topLeft.x, topLeft.y, width, height);
    ctx.strokeRect(topLeft.x, topLeft.y, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = "#D2B48C";
    ctx.lineWidth = 1;
    
    // Vertical grid lines (every 5 feet)
    for (let i = -FOUNDATION_WIDTH / 2; i <= FOUNDATION_WIDTH / 2; i += 5) {
      const start = foundationToCanvas(i, -FOUNDATION_HEIGHT / 2);
      const end = foundationToCanvas(i, FOUNDATION_HEIGHT / 2);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
    
    // Horizontal grid lines (every 5 feet)
    for (let i = -FOUNDATION_HEIGHT / 2; i <= FOUNDATION_HEIGHT / 2; i += 5) {
      const start = foundationToCanvas(-FOUNDATION_WIDTH / 2, i);
      const end = foundationToCanvas(FOUNDATION_WIDTH / 2, i);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }, [foundationToCanvas, scale]);
  
  // Draw blueprint if available
  const drawBlueprint = useCallback((ctx: CanvasRenderingContext2D) => {
    if (blueprint && blueprintImageRef.current && blueprintImageRef.current.complete) {
      try {
        const topLeft = foundationToCanvas(-FOUNDATION_WIDTH / 2, -FOUNDATION_HEIGHT / 2);
        const width = FOUNDATION_WIDTH * (CANVAS_WIDTH / FOUNDATION_WIDTH) * scale;
        const height = FOUNDATION_HEIGHT * (CANVAS_HEIGHT / FOUNDATION_HEIGHT) * scale;
        
        ctx.save();
        ctx.globalAlpha = 0.5; // Increased opacity for better visibility
        ctx.drawImage(blueprintImageRef.current, topLeft.x, topLeft.y, width, height);
        ctx.restore();
        
        // Debug info
        console.log("Blueprint drawn at:", { x: topLeft.x, y: topLeft.y, width, height });
      } catch (error) {
        console.error("Error drawing blueprint:", error);
      }
    } else if (blueprint) {
      console.warn("Blueprint reference missing or not loaded:", { 
        blueprint, 
        hasRef: !!blueprintImageRef.current,
        complete: blueprintImageRef.current?.complete 
      });
    }
  }, [blueprint, foundationToCanvas, scale]);
  
  // Draw pier
  const drawPier = useCallback((ctx: CanvasRenderingContext2D, pier: PierPlacement, isSelected: boolean = false) => {
    const position = foundationToCanvas(pier.x, pier.z);
    const markerSize = 12 * scale;
    
    // Pier colors
    const colors = {
      push_pier: "#FF6B6B",
      helical_pier: "#4ECDC4",
      steel_pier: "#45B7D1"
    };
    
    // Draw X marker
    ctx.strokeStyle = colors[pier.type];
    ctx.lineWidth = isSelected ? 4 : 3;
    ctx.lineCap = "round";
    
    // Draw X
    ctx.beginPath();
    ctx.moveTo(position.x - markerSize, position.y - markerSize);
    ctx.lineTo(position.x + markerSize, position.y + markerSize);
    ctx.moveTo(position.x + markerSize, position.y - markerSize);
    ctx.lineTo(position.x - markerSize, position.y + markerSize);
    ctx.stroke();
    
    // Draw selection circle
    if (isSelected) {
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(position.x, position.y, markerSize + 4, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    // Draw elevation label if available
    if (pier.elevation !== undefined) {
      ctx.fillStyle = "#333";
      ctx.font = `${Math.max(10, 11 * scale)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      
      const elevationText = `Elev: ${pier.elevation}`;
      ctx.fillText(elevationText, position.x, position.y + markerSize + 4);
    }
    
    // Draw pier type abbreviation
    ctx.fillStyle = colors[pier.type];
    ctx.font = `${Math.max(8, 9 * scale)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    
    const typeAbbr = pier.type === "push_pier" ? "P" : pier.type === "helical_pier" ? "H" : "S";
    ctx.fillText(typeAbbr, position.x, position.y - markerSize - 2);
  }, [foundationToCanvas, scale]);
  
  // Main drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw foundation first
    drawFoundation(ctx);
    
    // Draw blueprint overlay
    drawBlueprint(ctx);
    
    // Draw piers on top
    pierPlacements.forEach(pier => {
      drawPier(ctx, pier, pier.id === selectedPier);
    });
  }, [drawBlueprint, drawFoundation, drawPier, pierPlacements, selectedPier]);
  
  // Handle canvas click and touch
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!editable) {
      console.log("Canvas not editable, interaction ignored");
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Handle both mouse and touch events
    let clientX: number, clientY: number;
    if ('touches' in event) {
      // Touch event
      if (event.touches.length === 0) return;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    console.log("Canvas clicked at:", { x, y });
    
    // Check if clicking on existing pier
    const clickedPier = pierPlacements.find(pier => {
      const pierPos = foundationToCanvas(pier.x, pier.z);
      const distance = Math.sqrt(Math.pow(x - pierPos.x, 2) + Math.pow(y - pierPos.y, 2));
      return distance <= 16 * scale; // Increased hit area for X markers
    });
    
    if (clickedPier) {
      console.log("Clicked on existing pier:", clickedPier.id);
      setSelectedPier(selectedPier === clickedPier.id ? null : clickedPier.id);
      return;
    }
    
    // Check if clicking within foundation bounds
    const foundationPos = canvasToFoundation(x, y);
    console.log("Foundation position:", foundationPos);
    
    if (Math.abs(foundationPos.x) <= FOUNDATION_WIDTH / 2 && 
        Math.abs(foundationPos.y) <= FOUNDATION_HEIGHT / 2) {
      
      console.log("Valid foundation click, opening modal");
      // Open modal for pier placement
      setPendingPierLocation(foundationPos);
      setModalPosition({ x: clientX, y: clientY });
      setModalOpen(true);
    } else {
      console.log("Click outside foundation bounds");
    }
  }, [
    editable, 
    pierPlacements, 
    foundationToCanvas, 
    canvasToFoundation, 
    scale, 
    selectedPier
  ]);
  
  // Enhanced blueprint loading with multiple fallback strategies
  useEffect(() => {
    if (blueprint) {
      let attempts = 0;
      const maxAttempts = 3;
      
      // Set up timeout for loading with retries
      const loadingTimeout = setTimeout(() => {
        console.warn("Blueprint loading timeout after all attempts, proceeding without image");
        (blueprintImageRef as any).current = null;
        draw();
      }, 30000); // Extended timeout for retries
      
      const tryLoadBlueprint = (url: string, attempt: number = 1) => {
        const currentImg = new Image();
        
        currentImg.onload = () => {
          if (!loadingTimeout) return; // Already timed out
          clearTimeout(loadingTimeout);
          console.log(`Blueprint loaded successfully on attempt ${attempt}:`, url);
          (blueprintImageRef as any).current = currentImg;
          draw();
        };
        
        currentImg.onerror = (error) => {
          console.warn(`Blueprint load attempt ${attempt} failed for ${url}:`, error);
          attempts++;
          
          if (attempts < maxAttempts) {
            // Try next URL format
            const altUrls = [
              `/api/files/${blueprint}`,
              blueprint.startsWith('http') ? blueprint : `/api/files/${blueprint}`,
              blueprint.includes('/api/files/') ? blueprint : `/api/files/${blueprint}`,
              `${window.location.origin}/api/files/${blueprint}`,
              blueprint
            ];
            
            const nextUrl = altUrls[attempts];
            if (nextUrl && nextUrl !== url) {
              console.log(`Trying blueprint URL format ${attempts + 1}:`, nextUrl);
              setTimeout(() => tryLoadBlueprint(nextUrl, attempts + 1), 1000); // Delay between attempts
            } else {
              console.error("All blueprint URL formats exhausted");
              (blueprintImageRef as any).current = null;
              draw();
            }
          } else {
            console.error("Maximum blueprint load attempts exceeded");
            (blueprintImageRef as any).current = null;
            draw();
          }
        };
        
        // Set cross-origin for external URLs
        if (url.startsWith('http') && !url.startsWith(window.location.origin)) {
          currentImg.crossOrigin = 'anonymous';
        }
        
        currentImg.src = url;
      };
      
      // Start with primary URL
      tryLoadBlueprint(`/api/files/${blueprint}`, 1);
      
      // Cleanup timeout on unmount
      return () => {
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
      };
    } else {
      // Clear blueprint if no longer available
      (blueprintImageRef as any).current = null;
      draw();
    }
  }, [blueprint, draw]);
  
  // Redraw when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);
  
  // Remove selected pier
  const removeSelectedPier = useCallback(() => {
    if (selectedPier) {
      const newPlacements = pierPlacements.filter(p => p.id !== selectedPier);
      saveToHistory(pierPlacements);
      onPierPlacementChange(newPlacements);
      setSelectedPier(null);
    }
  }, [selectedPier, pierPlacements, onPierPlacementChange, saveToHistory]);
  
  // Export canvas as image
  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `foundation-plan-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, []);
  
  // Zoom and pan controls
  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    setScale(prevScale => Math.max(0.1, Math.min(5, prevScale * delta)));
  }, []);
  
  const getPierTypeCount = (type: string) => {
    return pierPlacements.filter(p => p.type === type).length;
  };

  // Handle modal save
  const handleModalSave = useCallback((pierData: Omit<PierPlacement, 'id'>) => {
    if (!pendingPierLocation) return;
    
    const newPier: PierPlacement = {
      id: `pier-${Date.now()}`,
      ...pierData
    };
    
    const newPlacements = [...pierPlacements, newPier];
    saveToHistory(pierPlacements);
    onPierPlacementChange(newPlacements);
    setSelectedPier(newPier.id);
    setPendingPierLocation(null);
  }, [pendingPierLocation, pierPlacements, onPierPlacementChange, saveToHistory]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setPendingPierLocation(null);
  }, []);

  return (
    <div className={`relative bg-white rounded-lg border border-slate-200 overflow-hidden ${className}`}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className={`w-full h-full ${editable ? 'cursor-crosshair' : 'cursor-default'} block touch-action-pan-zoom`}
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasClick}
        onWheel={handleWheel}
        style={{ zIndex: 1 }}
      />
      
      {/* Tool Panel */}
      {editable && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200 w-64">
          <h4 className="font-semibold text-sm mb-4 text-slate-900">Foundation Tool</h4>
          
          {/* Pier Type Selector */}
          <div className="space-y-2 mb-4">
            <label className="text-xs text-slate-600 block font-medium">Active Pier Type:</label>
            {[
              { type: "push_pier", label: "Push Pier", color: "bg-red-500" },
              { type: "helical_pier", label: "Helical Pier", color: "bg-teal-500" },
              { type: "steel_pier", label: "Steel Pier", color: "bg-blue-500" }
            ].map(({ type, label, color }) => (
              <button
                key={type}
                onClick={() => setSelectedPierType(type as PierPlacement["type"])}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-all border ${
                  selectedPierType === type 
                    ? `${color} text-white border-transparent shadow-md` 
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>{label}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                  {getPierTypeCount(type)}
                </span>
              </button>
            ))}
          </div>
          
          {/* Controls */}
          <div className="space-y-2 mb-4">
            <div className="flex space-x-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="flex-1 flex items-center justify-center px-2 py-1.5 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200 disabled:opacity-50"
              >
                <Undo className="w-3 h-3 mr-1" />
                Undo
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="flex-1 flex items-center justify-center px-2 py-1.5 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200 disabled:opacity-50"
              >
                <Redo className="w-3 h-3 mr-1" />
                Redo
              </button>
            </div>
            <button
              onClick={exportCanvas}
              className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              <Download className="w-3 h-3 mr-1" />
              Export Plan
            </button>
          </div>
          
          {/* Pier Summary */}
          <div className="border-t border-slate-200 pt-3">
            <div className="text-xs text-slate-600 mb-2 font-medium">Total Piers: {pierPlacements.length}</div>
            <div className="grid grid-cols-3 gap-1 text-xs">
              <div className="text-center p-2 bg-red-50 rounded">
                <div className="text-red-600 font-bold">{getPierTypeCount("push_pier")}</div>
                <div>Push</div>
              </div>
              <div className="text-center p-2 bg-teal-50 rounded">
                <div className="text-teal-600 font-bold">{getPierTypeCount("helical_pier")}</div>
                <div>Helical</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-blue-600 font-bold">{getPierTypeCount("steel_pier")}</div>
                <div>Steel</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Selected Pier Panel */}
      {selectedPier && editable && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200">
          <h4 className="font-semibold text-sm mb-2 text-slate-900">Selected Pier</h4>
          {(() => {
            const pier = pierPlacements.find(p => p.id === selectedPier);
            if (!pier) return null;
            
            return (
              <div>
                <div className="text-xs text-slate-600 space-y-1 mb-3">
                  <div>Type: <span className="font-medium">{pier.type.replace("_", " ")}</span></div>
                  <div>Position: <span className="font-medium">({pier.x.toFixed(1)}, {pier.z.toFixed(1)})</span></div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={removeSelectedPier}
                    className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 mr-1 inline" />
                    Remove
                  </button>
                  <button
                    onClick={() => setSelectedPier(null)}
                    className="px-3 py-1.5 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors"
                  >
                    Deselect
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
      
      {/* Instructions - Only show when no piers and no blueprint */}
      {pierPlacements.length === 0 && editable && !blueprint && (
        <div className="absolute inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center pointer-events-none z-10">
          <div className="bg-white/95 rounded-xl p-6 shadow-xl text-center max-w-sm pointer-events-auto">
            <h3 className="font-semibold text-lg text-slate-900 mb-2">Foundation Pier Planner</h3>
            <p className="text-slate-600 text-sm mb-4">
              Click on the foundation to place piers with detailed specifications. Use mouse wheel to zoom.
            </p>
            <div className="text-xs text-slate-500">
              💡 Click on placed X markers to select and manage them
            </div>
          </div>
        </div>
      )}
      
      {/* Blueprint status indicator */}
      {blueprint && editable && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              blueprintImageRef.current?.complete ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-slate-700">
              {blueprintImageRef.current?.complete ? 'Blueprint loaded' : 'Loading blueprint...'}
            </span>
          </div>
          {pierPlacements.length === 0 && (
            <p className="text-xs text-slate-500 mt-1">Click foundation to place piers</p>
          )}
        </div>
      )}

      {/* Pier Placement Modal */}
      <PierPlacementModal
        isOpen={modalOpen}
        position={modalPosition}
        onClose={handleModalClose}
        onSave={handleModalSave}
        foundationCoordinates={pendingPierLocation || { x: 0, y: 0 }}
      />
    </div>
  );
}
