import { Suspense, useRef, useState, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box, Plane, Text } from "@react-three/drei";
import { Mesh } from "three";
import { PierPlacement, PierPlacements } from "@/shared/types";

interface ThreeDViewerProps {
  pierPlacements: PierPlacements;
  onPierPlacementChange: (placements: PierPlacements) => void;
  editable?: boolean;
}

function House() {
  return (
    <group>
      {/* Foundation */}
      <Box args={[20, 1, 15]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#8B7355" />
      </Box>
      
      {/* House structure */}
      <Box args={[18, 8, 13]} position={[0, 4.5, 0]}>
        <meshStandardMaterial color="#D2B48C" opacity={0.8} transparent />
      </Box>
      
      {/* Roof */}
      <Box args={[20, 4, 15]} position={[0, 10, 0]}>
        <meshStandardMaterial color="#8B4513" />
      </Box>
      
      {/* Ground plane */}
      <Plane args={[50, 50]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <meshStandardMaterial color="#90EE90" opacity={0.3} transparent />
      </Plane>
    </group>
  );
}

function Pier({ placement, onClick, isSelected }: { 
  placement: PierPlacement; 
  onClick?: () => void;
  isSelected?: boolean;
}) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const getPierColor = (type: string) => {
    switch (type) {
      case "push_pier": return "#FF6B6B";
      case "helical_pier": return "#4ECDC4"; 
      case "steel_pier": return "#45B7D1";
      default: return "#666";
    }
  };
  
  const getHoverColor = (type: string) => {
    switch (type) {
      case "push_pier": return "#FF8A8A";
      case "helical_pier": return "#6EE7E0"; 
      case "steel_pier": return "#6BC7E8";
      default: return "#888";
    }
  };
  
  const pierColor = hovered || isSelected ? getHoverColor(placement.type) : getPierColor(placement.type);
  
  return (
    <group>
      <Box
        ref={meshRef}
        args={[1, 6, 1]}
        position={[placement.x, placement.y - 3, placement.z]}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <meshStandardMaterial 
          color={pierColor} 
          transparent={true}
          opacity={isSelected ? 0.8 : 1}
        />
      </Box>
      
      {/* Pier label */}
      {(hovered || isSelected) && (
        <Text
          position={[placement.x, placement.y + 2, placement.z]}
          fontSize={0.8}
          color="black"
          anchorX="center"
          anchorY="middle"
        >
          {placement.type.replace("_", " ")}
        </Text>
      )}
    </group>
  );
}

function FoundationPlane({ onPierPlacement, editable }: { 
  onPierPlacement?: (x: number, z: number) => void;
  editable?: boolean;
}) {
  const handleClick = (e: any) => {
    if (!editable || !onPierPlacement) return;
    
    e.stopPropagation();
    const point = e.point;
    // Constrain to foundation bounds
    const x = Math.max(-9, Math.min(9, point.x));
    const z = Math.max(-6, Math.min(6, point.z));
    onPierPlacement(x, z);
  };
  
  return (
    <Plane 
      args={[18, 13]} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0.6, 0]}
      onClick={handleClick}
      visible={false}
    />
  );
}

function Scene({ 
  pierPlacements, 
  onPierClick, 
  onPierPlacement,
  selectedPier,
  editable 
}: { 
  pierPlacements: PierPlacements; 
  onPierClick?: (placement: PierPlacement) => void;
  onPierPlacement?: (x: number, z: number) => void;
  selectedPier?: PierPlacement | null;
  editable?: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[0, 20, 0]} intensity={0.5} />
      
      <House />
      
      {/* Interactive foundation plane for placing piers */}
      {editable && (
        <FoundationPlane onPierPlacement={onPierPlacement} editable={editable} />
      )}
      
      {pierPlacements.map((placement) => (
        <Pier
          key={placement.id}
          placement={placement}
          onClick={() => onPierClick?.(placement)}
          isSelected={selectedPier?.id === placement.id}
        />
      ))}
      
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={15}
        maxDistance={50}
      />
    </>
  );
}

export default function ThreeDViewer({ pierPlacements, onPierPlacementChange, editable = false }: ThreeDViewerProps) {
  const [selectedPier, setSelectedPier] = useState<PierPlacement | null>(null);
  const [selectedPierType, setSelectedPierType] = useState<PierPlacement["type"]>("push_pier");
  const [showInstructions, setShowInstructions] = useState(editable);
  const [contextLost, setContextLost] = useState(false);
  
  // Handle WebGL context loss and restoration
  const onContextLost = useCallback((event: Event) => {
    event.preventDefault();
    console.warn("WebGL context lost, preventing reload");
    setContextLost(true);
  }, []);
  
  const onContextRestored = useCallback(() => {
    console.log("WebGL context restored");
    setContextLost(false);
  }, []);
  
  useEffect(() => {
    // Cleanup any existing event listeners first
    return () => {
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        canvas.removeEventListener('webglcontextlost', onContextLost);
        canvas.removeEventListener('webglcontextrestored', onContextRestored);
      });
    };
  }, []);
  
  useEffect(() => {
    // Add a small delay to ensure canvas is rendered
    const timer = setTimeout(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('webglcontextlost', onContextLost);
        canvas.addEventListener('webglcontextrestored', onContextRestored);
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', onContextLost);
        canvas.removeEventListener('webglcontextrestored', onContextRestored);
      }
    };
  }, [onContextLost, onContextRestored]);
  
  const handlePierClick = (placement: PierPlacement) => {
    if (editable) {
      if (selectedPier?.id === placement.id) {
        setSelectedPier(null);
      } else {
        setSelectedPier(placement);
      }
    }
  };
  
  const handlePierPlacement = (x: number, z: number) => {
    if (!editable) return;
    
    const newPier: PierPlacement = {
      id: `pier-${Date.now()}`,
      x,
      y: 0,
      z,
      type: selectedPierType,
      notes: "",
    };
    
    onPierPlacementChange([...pierPlacements, newPier]);
    setShowInstructions(false);
  };
  
  const addPier = (type: PierPlacement["type"]) => {
    const newPier: PierPlacement = {
      id: `pier-${Date.now()}`,
      x: Math.random() * 16 - 8, // Random position within house bounds
      y: 0,
      z: Math.random() * 12 - 6,
      type,
      notes: "",
    };
    
    onPierPlacementChange([...pierPlacements, newPier]);
  };
  
  const removePier = (pierId: string) => {
    onPierPlacementChange(pierPlacements.filter(p => p.id !== pierId));
    setSelectedPier(null);
  };
  
  return (
    <div className="h-full w-full relative bg-gradient-to-b from-sky-200 to-sky-100 rounded-lg overflow-hidden">
      {contextLost ? (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/95 rounded-xl p-6 shadow-xl max-w-md text-center">
            <h3 className="font-semibold text-lg text-slate-900 mb-2">3D Viewer Temporarily Unavailable</h3>
            <p className="text-slate-600 text-sm mb-4">
              The 3D graphics context was lost. Please refresh the page to restore the 3D viewer.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      ) : (
        <Canvas 
          camera={{ position: [25, 15, 25], fov: 60 }}
          gl={{ 
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
            antialias: true,
            alpha: false
          }}
          onCreated={({ gl }) => {
            try {
              gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
              
              // Add context loss handlers with proper cleanup
              const handleContextLost = (event: Event) => {
                event.preventDefault();
                onContextLost(event);
              };
              
              gl.domElement.addEventListener('webglcontextlost', handleContextLost, false);
              gl.domElement.addEventListener('webglcontextrestored', onContextRestored, false);
            } catch (error) {
              console.error("WebGL setup error:", error);
              setContextLost(true);
            }
          }}
        >
          <Suspense fallback={null}>
            <Scene 
              pierPlacements={pierPlacements} 
              onPierClick={handlePierClick}
              onPierPlacement={handlePierPlacement}
              selectedPier={selectedPier}
              editable={editable}
            />
          </Suspense>
        </Canvas>
      )}
      
      {/* Instructions overlay */}
      {editable && showInstructions && pierPlacements.length === 0 && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 rounded-xl p-6 shadow-xl max-w-md text-center">
            <h3 className="font-semibold text-lg text-slate-900 mb-2">Interactive Pier Placement</h3>
            <p className="text-slate-600 text-sm mb-4">
              Select a pier type from the panel, then click anywhere on the foundation to place piers. 
              Drag to rotate and zoom the view.
            </p>
            <div className="text-xs text-slate-500">
              💡 Tip: Click on placed piers to select and manage them
            </div>
          </div>
        </div>
      )}
      
      {editable && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200">
          <h4 className="font-semibold text-sm mb-3 text-slate-900">Pier Selection</h4>
          
          {/* Pier Type Selector */}
          <div className="space-y-2 mb-4">
            <label className="text-xs text-slate-600 block">Active Pier Type:</label>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setSelectedPierType("push_pier")}
                className={`px-3 py-2 text-xs rounded-md transition-all border ${
                  selectedPierType === "push_pier" 
                    ? "bg-red-500 text-white border-red-600 shadow-md" 
                    : "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                }`}
              >
                Push Pier
              </button>
              <button
                onClick={() => setSelectedPierType("helical_pier")}
                className={`px-3 py-2 text-xs rounded-md transition-all border ${
                  selectedPierType === "helical_pier" 
                    ? "bg-teal-500 text-white border-teal-600 shadow-md" 
                    : "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200"
                }`}
              >
                Helical Pier
              </button>
              <button
                onClick={() => setSelectedPierType("steel_pier")}
                className={`px-3 py-2 text-xs rounded-md transition-all border ${
                  selectedPierType === "steel_pier" 
                    ? "bg-blue-500 text-white border-blue-600 shadow-md" 
                    : "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                }`}
              >
                Steel Pier
              </button>
            </div>
          </div>
          
          {/* Random Placement */}
          <div className="border-t border-slate-200 pt-3">
            <label className="text-xs text-slate-600 block mb-2">Quick Add:</label>
            <button
              onClick={() => addPier(selectedPierType)}
              className="w-full px-3 py-2 text-xs bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
            >
              Add Random {selectedPierType.replace("_", " ")}
            </button>
          </div>
          
          {pierPlacements.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200">
              <p className="text-xs text-slate-600 mb-1">
                <strong>{pierPlacements.length}</strong> piers placed
              </p>
              <div className="text-xs text-slate-500">
                Click on foundation to place • Click piers to select
              </div>
            </div>
          )}
        </div>
      )}
      
      {selectedPier && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200">
          <h4 className="font-semibold text-sm mb-2 text-slate-900">Selected Pier</h4>
          <div className="text-xs text-slate-600 space-y-1 mb-3">
            <div>Type: <span className="font-medium">{selectedPier.type.replace("_", " ")}</span></div>
            <div>Position: <span className="font-medium">({selectedPier.x.toFixed(1)}, {selectedPier.z.toFixed(1)})</span></div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => removePier(selectedPier.id)}
              className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Remove Pier
            </button>
            <button
              onClick={() => setSelectedPier(null)}
              className="px-3 py-1.5 text-xs bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
            >
              Deselect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
