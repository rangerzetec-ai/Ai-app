import { Suspense, useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Box, Plane, Html } from "@react-three/drei";
import { Mesh, Vector3 } from "three";
import * as THREE from "three";
import { PierPlacement, PierPlacements } from "@/shared/types";
import { Enhanced3DErrorBoundary } from "./SafeErrorBoundary";
import PierPlacementModal from "./PierPlacementModal";

interface Enhanced3DViewerProps {
  pierPlacements: PierPlacements;
  onPierPlacementChange: (placements: PierPlacements) => void;
  editable?: boolean;
  blueprint?: string; // Optional blueprint/sketch overlay
}

// Texture cache to prevent memory leaks from repeated loading
const textureCache = new Map<string, THREE.Texture>();

// Memory monitoring utility
const memoryMonitor = {
  checkMemory: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory usage:', {
        used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
      });
      
      // Warning if memory usage is high
      if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
        console.warn('High memory usage detected. Consider refreshing the page.');
        return true;
      }
    }
    return false;
  },
  
  clearTextureCache: () => {
    textureCache.forEach(texture => {
      texture.dispose();
    });
    textureCache.clear();
    console.log('Texture cache cleared');
  }
};

function HouseFoundation({ onFoundationClick, editable, blueprint }: { 
  onFoundationClick?: (point: Vector3, event?: any) => void;
  editable?: boolean;
  blueprint?: string;
}) {
  const meshRef = useRef<Mesh>(null);
  
  const handleClick = (e: any) => {
    if (!editable || !onFoundationClick) return;
    
    e.stopPropagation();
    
    // Calculate foundation-relative coordinates
    const point = e.point;
    const foundationX = Math.max(-9, Math.min(9, point.x));
    const foundationZ = Math.max(-6.5, Math.min(6.5, point.z));
    
    onFoundationClick(new Vector3(foundationX, 0.5, foundationZ), e.nativeEvent);
  };
  
  // Get or create blueprint texture with memory management
  const getBlueprintTexture = useCallback(() => {
    if (!blueprint) return null;
    
    // Check cache first
    if (textureCache.has(blueprint)) {
      return textureCache.get(blueprint)!;
    }
    
    // Limit cache size to prevent memory issues
    if (textureCache.size > 10) {
      const firstKey = textureCache.keys().next().value;
      if (firstKey) {
        const oldTexture = textureCache.get(firstKey);
        if (oldTexture) {
          oldTexture.dispose();
          textureCache.delete(firstKey);
        }
      }
    }
    
    try {
      const texture = new THREE.TextureLoader().load(
        `/api/files/${blueprint}`,
        (loadedTexture) => {
          console.log('Blueprint texture loaded successfully');
          loadedTexture.needsUpdate = true;
        },
        undefined,
        (error) => {
          console.warn("Failed to load blueprint texture:", error);
          if (blueprint) {
            textureCache.delete(blueprint);
          }
        }
      );
      
      // Store in cache
      textureCache.set(blueprint, texture);
      return texture;
    } catch (error) {
      console.warn("Error creating texture loader:", error);
      return null;
    }
  }, [blueprint]);
  
  return (
    <group>
      {/* Main Foundation */}
      <Box 
        ref={meshRef}
        args={[18, 1, 13]} 
        position={[0, 0, 0]}
        onClick={handleClick}
      >
        <meshStandardMaterial 
          color="#8B7355" 
          transparent 
          opacity={editable ? 0.8 : 1}
        />
      </Box>
      
      {/* Foundation walls for visual reference */}
      <Box args={[18.5, 0.5, 0.5]} position={[0, 0.75, 6.75]}>
        <meshStandardMaterial color="#654321" />
      </Box>
      <Box args={[18.5, 0.5, 0.5]} position={[0, 0.75, -6.75]}>
        <meshStandardMaterial color="#654321" />
      </Box>
      <Box args={[0.5, 0.5, 13]} position={[9.25, 0.75, 0]}>
        <meshStandardMaterial color="#654321" />
      </Box>
      <Box args={[0.5, 0.5, 13]} position={[-9.25, 0.75, 0]}>
        <meshStandardMaterial color="#654321" />
      </Box>
      
      {/* House structure (transparent) */}
      <Box args={[16, 8, 11]} position={[0, 4.5, 0]}>
        <meshStandardMaterial color="#D2B48C" opacity={0.3} transparent />
      </Box>
      
      {/* Roof */}
      <Box args={[18, 3, 13]} position={[0, 9.5, 0]}>
        <meshStandardMaterial color="#8B4513" opacity={0.6} transparent />
      </Box>
      
      {/* Ground plane */}
      <Plane args={[50, 50]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <meshStandardMaterial color="#90EE90" opacity={0.2} transparent />
      </Plane>
      
      {/* Blueprint overlay on foundation with cached texture */}
      {blueprint && (
        <Plane args={[18, 13]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.52, 0]}>
          <meshBasicMaterial 
            map={getBlueprintTexture()}
            transparent 
            opacity={0.4}
          />
        </Plane>
      )}
      
      {/* Foundation grid for placement guidance */}
      {editable && (
        <>
          {/* Grid lines */}
          {Array.from({ length: 5 }, (_, i) => (
            <Box 
              key={`grid-x-${i}`}
              args={[18, 0.02, 0.05]} 
              position={[0, 0.51, -6 + i * 3]}
            >
              <meshStandardMaterial color="#666" opacity={0.3} transparent />
            </Box>
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <Box 
              key={`grid-z-${i}`}
              args={[0.05, 0.02, 13]} 
              position={[-9 + i * 3, 0.51, 0]}
            >
              <meshStandardMaterial color="#666" opacity={0.3} transparent />
            </Box>
          ))}
        </>
      )}
    </group>
  );
}

function PierComponent({ 
  placement, 
  onClick, 
  isSelected, 
  isHovered,
  onHover 
}: { 
  placement: PierPlacement; 
  onClick?: () => void;
  isSelected?: boolean;
  isHovered?: boolean;
  onHover?: (hovered: boolean) => void;
}) {
  const meshRef = useRef<Mesh>(null);
  
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
      case "push_pier": return "#FF8E8E";
      case "helical_pier": return "#7DEDEA"; 
      case "steel_pier": return "#73D1F0";
      default: return "#888";
    }
  };
  
  const pierColor = isHovered || isSelected ? getHoverColor(placement.type) : getPierColor(placement.type);
  const scale = isHovered ? 1.1 : isSelected ? 1.05 : 1;
  
  return (
    <group>
      {/* Pier shaft */}
      <Box
        ref={meshRef}
        args={[0.8, 6, 0.8]}
        position={[placement.x, placement.y - 3, placement.z]}
        scale={[scale, 1, scale]}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover?.(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover?.(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <meshStandardMaterial 
          color={pierColor}
          transparent={true}
          opacity={isSelected ? 0.9 : 1}
          metalness={0.3}
          roughness={0.7}
        />
      </Box>
      
      {/* Pier cap */}
      <Box
        args={[1.2, 0.3, 1.2]}
        position={[placement.x, placement.y + 0.15, placement.z]}
        scale={[scale, 1, scale]}
      >
        <meshStandardMaterial color={pierColor} metalness={0.5} roughness={0.5} />
      </Box>
      
      {/* Pier label */}
      {(isHovered || isSelected) && (
        <Html position={[placement.x, placement.y + 2, placement.z]} center>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs font-medium pointer-events-none">
            {placement.type.replace("_", " ").toUpperCase()}
            <div className="text-xs opacity-75">
              ({placement.x.toFixed(1)}, {placement.z.toFixed(1)})
            </div>
            {placement.elevation !== undefined && (
              <div className="text-xs opacity-75">
                Elev: {placement.elevation}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

function CameraController() {
  const { camera } = useThree();
  
  useEffect(() => {
    // Set optimal initial camera position
    camera.position.set(25, 15, 25);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return null;
}

function Scene({ 
  pierPlacements, 
  onPierClick, 
  onFoundationClick,
  selectedPier,
  hoveredPier,
  setHoveredPier,
  editable,
  blueprint
}: { 
  pierPlacements: PierPlacements; 
  onPierClick?: (placement: PierPlacement) => void;
  onFoundationClick?: (point: Vector3, event?: any) => void;
  selectedPier?: PierPlacement | null;
  hoveredPier?: string | null;
  setHoveredPier?: (id: string | null) => void;
  editable?: boolean;
  blueprint?: string;
}) {
  return (
    <>
      <CameraController />
      
      {/* Optimized lighting for performance */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1} 
        castShadow={false} // Disable shadows for better performance
      />
      <pointLight position={[-10, 15, -10]} intensity={0.3} />
      
      {/* Foundation and house */}
      <HouseFoundation onFoundationClick={onFoundationClick} editable={editable} blueprint={blueprint} />
      
      {/* Pier components - Optimized with key prop for better re-rendering */}
      {pierPlacements.map((placement) => (
        <PierComponent
          key={placement.id}
          placement={placement}
          onClick={() => onPierClick?.(placement)}
          isSelected={selectedPier?.id === placement.id}
          isHovered={hoveredPier === placement.id}
          onHover={(hovered) => setHoveredPier?.(hovered ? placement.id : null)}
        />
      ))}
      
      {/* Enhanced orbit controls with performance optimizations */}
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 6}
        minDistance={10}
        maxDistance={60}
        target={[0, 2, 0]}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  );
}

export default function Enhanced3DViewer({ 
  pierPlacements, 
  onPierPlacementChange, 
  editable = false,
  blueprint
}: Enhanced3DViewerProps) {
  const [selectedPier, setSelectedPier] = useState<PierPlacement | null>(null);
  const [hoveredPier, setHoveredPier] = useState<string | null>(null);
  const [selectedPierType, setSelectedPierType] = useState<PierPlacement["type"]>("push_pier");
  const [contextLost, setContextLost] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [pendingPierLocation, setPendingPierLocation] = useState<{ x: number; y: number } | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [memoryWarning, setMemoryWarning] = useState(false);
  
  // Memory monitoring
  useEffect(() => {
    const checkMemory = () => {
      const isHighMemory = memoryMonitor.checkMemory();
      setMemoryWarning(isHighMemory);
    };
    
    // Check memory every 30 seconds
    const memoryInterval = setInterval(checkMemory, 30000);
    
    return () => {
      clearInterval(memoryInterval);
    };
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear texture cache when component unmounts
      memoryMonitor.clearTextureCache();
      
      // Clean up any hanging DOM references
      document.body.style.cursor = 'auto';
    };
  }, []);
  
  // Comprehensive WebGL support detection
  const checkWebGLSupport = useCallback(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        console.warn("WebGL not supported by browser");
        return false;
      }
      
      const webglContext = gl as WebGLRenderingContext;
      
      // Test basic WebGL functionality
      try {
        const version = webglContext.getParameter(webglContext.VERSION);
        const vendor = webglContext.getParameter(webglContext.VENDOR);
        if (!version || !vendor) {
          console.warn("WebGL context appears non-functional");
          return false;
        }
        
        // Test shader compilation
        const vertexShader = webglContext.createShader(webglContext.VERTEX_SHADER);
        if (!vertexShader) {
          console.warn("WebGL shader creation failed");
          return false;
        }
        
        webglContext.deleteShader(vertexShader);
        return true;
      } catch (testError) {
        console.warn("WebGL functionality test failed:", testError);
        return false;
      }
    } catch (error) {
      console.warn("WebGL support check failed:", error);
      return false;
    }
  }, []);
  
  // Enhanced WebGL context loss handling with memory cleanup
  const onContextLost = useCallback((event: Event) => {
    event.preventDefault();
    console.warn("WebGL context lost - implementing comprehensive recovery and cleanup");
    setContextLost(true);
    
    // Clear texture cache to free memory
    memoryMonitor.clearTextureCache();
    
    // Stop all rendering immediately
    try {
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        try {
          const gl = canvas.getContext('webgl') || canvas.getContext('webgl2') || canvas.getContext('experimental-webgl');
          if (gl) {
            const webglContext = gl as WebGLRenderingContext;
            if (webglContext.isContextLost && webglContext.isContextLost()) {
              console.log("Confirmed WebGL context lost, performing safe cleanup");
              canvas.style.display = 'none';
            }
          }
        } catch (cleanupError) {
          console.warn("Cleanup error during context loss (expected):", cleanupError);
        }
      });
    } catch (error) {
      console.warn("Error during WebGL cleanup:", error);
    }
    
    // Progressive recovery with memory consideration
    let retryDelay = 5000; // Longer initial delay
    const attemptRecovery = (attempt = 1) => {
      console.log(`Attempting WebGL context recovery (attempt ${attempt})`);
      
      setTimeout(() => {
        try {
          // Check memory before attempting recovery
          const isHighMemory = memoryMonitor.checkMemory();
          if (isHighMemory && attempt === 1) {
            console.warn("High memory usage detected, clearing caches before recovery");
            memoryMonitor.clearTextureCache();
            // Force garbage collection if available
            if (window.gc) {
              window.gc();
            }
          }
          
          if (!checkWebGLSupport()) {
            if (attempt < 3) {
              console.warn(`WebGL still unavailable, retrying in ${retryDelay}ms`);
              retryDelay *= 1.5;
              attemptRecovery(attempt + 1);
            } else {
              console.error("WebGL recovery failed after multiple attempts");
              setWebglSupported(false);
              setContextLost(true);
            }
            return;
          }
          
          console.log("WebGL appears to be available, attempting recovery");
          setContextLost(false);
          setWebglSupported(true);
        } catch (error) {
          console.error(`Recovery attempt ${attempt} failed:`, error);
          if (attempt < 3) {
            retryDelay *= 1.5;
            attemptRecovery(attempt + 1);
          } else {
            console.error("All recovery attempts failed");
            setWebglSupported(false);
            setContextLost(true);
          }
        }
      }, retryDelay);
    };
    
    attemptRecovery();
  }, [checkWebGLSupport]);
  
  const onContextRestored = useCallback(() => {
    console.log("WebGL context restored successfully");
    setContextLost(false);
    setWebglSupported(true);
    
    // Clear texture cache to start fresh
    memoryMonitor.clearTextureCache();
  }, []);
  
  // Check WebGL support on component mount
  useEffect(() => {
    const isSupported = checkWebGLSupport();
    setWebglSupported(isSupported);
    
    if (!isSupported) {
      console.warn("WebGL not supported - using fallback UI");
      setContextLost(true);
    }
  }, [checkWebGLSupport]);
  
  const handlePierClick = (placement: PierPlacement) => {
    if (editable) {
      setSelectedPier(selectedPier?.id === placement.id ? null : placement);
    }
  };
  
  const handleFoundationClick = (point: Vector3, event?: any) => {
    if (!editable) return;
    
    // Dismiss instructions when first pier is placed
    setShowInstructions(false);
    
    // Get screen coordinates for modal positioning
    const screenX = event?.clientX || window.innerWidth / 2;
    const screenY = event?.clientY || window.innerHeight / 2;
    
    // Open modal for pier placement
    setPendingPierLocation({ x: point.x, y: point.z });
    setModalPosition({ x: screenX, y: screenY });
    setModalOpen(true);
  };
  
  const removePier = (pierId: string) => {
    onPierPlacementChange(pierPlacements.filter(p => p.id !== pierId));
    setSelectedPier(null);
  };
  
  const getPierTypeCount = (type: string) => {
    return pierPlacements.filter(p => p.type === type).length;
  };
  
  const getPierTypeIcon = (type: string) => {
    switch (type) {
      case "push_pier": return "🔴";
      case "helical_pier": return "🟢";
      case "steel_pier": return "🔵";
      default: return "⚫";
    }
  };

  // Handle modal save
  const handleModalSave = useCallback((pierData: Omit<PierPlacement, 'id'>) => {
    if (!pendingPierLocation) return;
    
    const newPier: PierPlacement = {
      id: `pier-${Date.now()}`,
      ...pierData
    };
    
    onPierPlacementChange([...pierPlacements, newPier]);
    setSelectedPier(newPier);
    setPendingPierLocation(null);
  }, [pendingPierLocation, pierPlacements, onPierPlacementChange]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setPendingPierLocation(null);
  }, []);

  return (
    <Enhanced3DErrorBoundary>
      <div className="h-full w-full relative bg-gradient-to-b from-sky-200 to-sky-100 rounded-lg overflow-hidden">
        {/* Memory Warning */}
        {memoryWarning && (
          <div className="absolute top-2 left-2 right-2 z-50 bg-orange-100 border border-orange-300 rounded-lg p-2">
            <div className="text-orange-800 text-xs font-medium">
              ⚠️ High memory usage detected. Consider refreshing the page if performance degrades.
            </div>
          </div>
        )}
        
        {(contextLost || !webglSupported) ? (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/95 rounded-xl p-6 shadow-xl max-w-md text-center">
            <h3 className="font-semibold text-lg text-slate-900 mb-2">
              {!webglSupported ? '3D Graphics Not Supported' : '3D Viewer Temporarily Unavailable'}
            </h3>
            <p className="text-slate-600 text-sm mb-4">
              {!webglSupported 
                ? "Your browser or device doesn't support 3D graphics. Please use the 2D foundation planner instead."
                : "The 3D graphics context was lost. This may be due to memory constraints or graphics driver issues."
              }
            </p>
            {webglSupported && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    memoryMonitor.clearTextureCache();
                    window.location.reload();
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Memory & Refresh
                </button>
                <button
                  onClick={() => setContextLost(false)}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Canvas 
          camera={{ position: [25, 15, 25], fov: 60 }}
          shadows={false} // Disable shadows for better performance
          performance={{ min: 0.5 }}
          gl={{ 
            preserveDrawingBuffer: false,
            powerPreference: "default",
            antialias: false,
            alpha: false,
            failIfMajorPerformanceCaveat: false,
            stencil: false,
            depth: true,
            logarithmicDepthBuffer: false,
            premultipliedAlpha: false,
            precision: "mediump",
          }}
          frameloop="demand" // Only render when needed
          resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
          onCreated={({ gl, scene }) => {
            try {
              const context = gl.getContext();
              
              if (!context || !gl || !gl.domElement) {
                console.error("Critical WebGL components not available");
                setContextLost(true);
                return;
              }
              
              // Add context loss/restore handlers
              const handleContextLost = (event: Event) => {
                onContextLost(event);
              };
              
              const handleContextRestored = () => {
                onContextRestored();
              };
              
              if (gl.domElement) {
                gl.domElement.addEventListener('webglcontextlost', handleContextLost, false);
                gl.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);
                
                // Memory-conscious renderer setup
                const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
                gl.setPixelRatio(pixelRatio);
                
                // Cleanup function
                return () => {
                  gl.domElement.removeEventListener('webglcontextlost', handleContextLost);
                  gl.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
                  
                  // Dispose of Three.js resources
                  if (scene) {
                    scene.traverse((object: any) => {
                      if (object.geometry) object.geometry.dispose();
                      if (object.material) {
                        if (Array.isArray(object.material)) {
                          object.material.forEach((material: any) => material.dispose());
                        } else {
                          object.material.dispose();
                        }
                      }
                    });
                  }
                  
                  // Clear texture cache
                  memoryMonitor.clearTextureCache();
                };
              }
              
            } catch (error) {
              console.error("WebGL initialization failed:", error);
              setContextLost(true);
              setWebglSupported(false);
            }
          }}
        >
          <Suspense fallback={
            <Html center>
              <div className="bg-white/90 rounded-lg p-4 shadow-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                <div className="text-sm text-slate-600">Loading 3D Scene...</div>
              </div>
            </Html>
          }>
            <Scene 
              pierPlacements={pierPlacements} 
              onPierClick={handlePierClick}
              onFoundationClick={handleFoundationClick}
              selectedPier={selectedPier}
              hoveredPier={hoveredPier}
              setHoveredPier={setHoveredPier}
              editable={editable}
              blueprint={blueprint}
            />
          </Suspense>
        </Canvas>
      )}
      
      {/* Enhanced Tool Panel */}
      {editable && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-slate-200 min-w-[280px]">
          <h4 className="font-semibold text-sm mb-4 text-slate-900 flex items-center">
            🔧 Foundation Pier Tool
          </h4>
          
          {/* Pier Type Selector */}
          <div className="space-y-3 mb-4">
            <label className="text-xs text-slate-600 block font-medium">Select Pier Type:</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { type: "push_pier", label: "Push Pier", color: "bg-red-500", icon: "🔴" },
                { type: "helical_pier", label: "Helical Pier", color: "bg-teal-500", icon: "🟢" },
                { type: "steel_pier", label: "Steel Pier", color: "bg-blue-500", icon: "🔵" }
              ].map(({ type, label, color, icon }) => (
                <button
                  key={type}
                  onClick={() => setSelectedPierType(type as PierPlacement["type"])}
                  className={`flex items-center justify-between px-3 py-2 text-xs rounded-md transition-all border font-medium ${
                    selectedPierType === type 
                      ? `${color} text-white border-transparent shadow-md` 
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center">
                    <span className="mr-2">{icon}</span>
                    {label}
                  </span>
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                    {getPierTypeCount(type)}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Performance Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="text-xs text-blue-700">
              <div className="font-medium mb-1">📍 Placement Mode Active</div>
              <div>Click anywhere on the brown foundation to place a {selectedPierType.replace("_", " ")}</div>
              {pierPlacements.length > 50 && (
                <div className="text-orange-600 mt-1">
                  ⚠️ Many piers detected. Consider using 2D mode for large projects.
                </div>
              )}
            </div>
          </div>
          
          {/* Pier Summary */}
          <div className="border-t border-slate-200 pt-3">
            <label className="text-xs text-slate-600 block mb-2 font-medium">Pier Summary:</label>
            <div className="text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Piers:</span>
                <span className="font-bold text-lg">{pierPlacements.length}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center p-2 bg-red-50 rounded">
                  <div className="text-red-600 font-bold">{getPierTypeCount("push_pier")}</div>
                  <div className="text-xs text-red-600">Push</div>
                </div>
                <div className="text-center p-2 bg-teal-50 rounded">
                  <div className="text-teal-600 font-bold">{getPierTypeCount("helical_pier")}</div>
                  <div className="text-xs text-teal-600">Helical</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="text-blue-600 font-bold">{getPierTypeCount("steel_pier")}</div>
                  <div className="text-xs text-blue-600">Steel</div>
                </div>
              </div>
            </div>
          </div>
          
          {pierPlacements.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="text-xs text-slate-500 text-center">
                💡 Click on piers to select • Drag to rotate view
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Selected Pier Panel */}
      {selectedPier && editable && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-slate-200">
          <h4 className="font-semibold text-sm mb-2 text-slate-900 flex items-center">
            {getPierTypeIcon(selectedPier.type)} Selected Pier
          </h4>
          <div className="text-xs text-slate-600 space-y-1 mb-3">
            <div>Type: <span className="font-medium text-slate-900">{selectedPier.type.replace("_", " ")}</span></div>
            <div>Position: <span className="font-medium text-slate-900">({selectedPier.x.toFixed(1)}, {selectedPier.z.toFixed(1)})</span></div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => removePier(selectedPier.id)}
              className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium"
            >
              🗑️ Remove
            </button>
            <button
              onClick={() => setSelectedPier(null)}
              className="px-3 py-1.5 text-xs bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
            >
              ✕ Deselect
            </button>
          </div>
        </div>
      )}
      
      {/* Instructions Overlay for Empty State */}
      {editable && pierPlacements.length === 0 && showInstructions && (
        <div 
          className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center cursor-pointer"
          onClick={() => setShowInstructions(false)}
        >
          <div 
            className="bg-white/95 rounded-2xl p-8 shadow-2xl max-w-md text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
            <div className="text-4xl mb-4">🏗️</div>
            <h3 className="font-semibold text-xl text-slate-900 mb-3">Foundation Pier Placement</h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Select a pier type from the panel, then click anywhere on the brown foundation to place piers. 
              Drag to rotate and zoom the 3D view for better precision.
            </p>
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 mb-4">
              💡 <strong>Pro Tip:</strong> For large projects (50+ piers), consider using 2D mode for better performance
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Got it, let me start placing piers
            </button>
            <div className="text-xs text-slate-400 mt-2">
              Click anywhere to dismiss this overlay
            </div>
          </div>
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
    </Enhanced3DErrorBoundary>
  );
}
