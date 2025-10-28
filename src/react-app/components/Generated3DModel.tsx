import { Suspense, useRef, useEffect, useState, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Box, Plane, Html, Sphere } from "@react-three/drei";
import { Mesh } from "three";
import * as THREE from "three";
import { PierPlacement, PierPlacements } from "@/shared/types";
import { Enhanced3DErrorBoundary } from "./SafeErrorBoundary";

interface GeneratedModelData {
  generated: boolean;
  timestamp: string;
  source_photos: string[];
  source_sketch?: string;
  model_url: string;
  processing_time: string;
  confidence: number;
  foundation_dimensions: {
    length: number;
    width: number;
    estimated_depth: number;
  };
}

interface Generated3DModelProps {
  modelData: GeneratedModelData;
  pierPlacements: PierPlacements;
  blueprint?: string;
}

// Shared texture cache for client presentation
const clientTextureCache = new Map<string, THREE.Texture>();

// Memory management utilities for client presentation
const clientMemoryManager = {
  checkMemory: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Client presentation memory usage:', {
        used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB'
      });
      
      if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.9) {
        console.warn('Very high memory usage in client presentation');
        return true;
      }
    }
    return false;
  },
  
  clearCache: () => {
    clientTextureCache.forEach(texture => {
      texture.dispose();
    });
    clientTextureCache.clear();
    console.log('Client presentation texture cache cleared');
  },
  
  disposeObject: (object: any) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((material: any) => material.dispose());
      } else {
        object.material.dispose();
      }
    }
    if (object.children) {
      object.children.forEach(clientMemoryManager.disposeObject);
    }
  }
};

function ClientFoundation({ 
  modelData, 
  blueprint 
}: { 
  modelData: GeneratedModelData;
  blueprint?: string;
}) {
  const meshRef = useRef<Mesh>(null);
  
  // Use dimensions from generated model
  const { length, width, estimated_depth } = modelData.foundation_dimensions;
  
  // Get blueprint texture with memory management
  const getBlueprintTexture = useCallback(() => {
    if (!blueprint) return null;
    
    // Check cache first
    if (clientTextureCache.has(blueprint)) {
      return clientTextureCache.get(blueprint)!;
    }
    
    // Limit cache size for client presentation
    if (clientTextureCache.size > 5) {
      const firstKey = clientTextureCache.keys().next().value;
      if (firstKey) {
        const oldTexture = clientTextureCache.get(firstKey);
        if (oldTexture) {
          oldTexture.dispose();
          clientTextureCache.delete(firstKey);
        }
      }
    }
    
    try {
      const texture = new THREE.TextureLoader().load(
        `/api/files/${blueprint}`,
        (loadedTexture) => {
          console.log('Client blueprint texture loaded');
          loadedTexture.needsUpdate = true;
        },
        undefined,
        (error) => {
          console.warn("Failed to load client blueprint texture:", error);
          if (blueprint) {
            clientTextureCache.delete(blueprint);
          }
        }
      );
      
      clientTextureCache.set(blueprint, texture);
      return texture;
    } catch (error) {
      console.warn("Error creating client texture loader:", error);
      return null;
    }
  }, [blueprint]);
  
  return (
    <group>
      {/* Beautiful Foundation */}
      <Box 
        ref={meshRef}
        args={[length, 1, width]} 
        position={[0, 0, 0]}
      >
        <meshStandardMaterial 
          color="#C4A17F" 
          roughness={0.7}
          metalness={0.1}
        />
      </Box>
      
      {/* Foundation walls with nice texture */}
      <Box args={[length + 0.5, 0.5, 0.5]} position={[0, 0.75, width/2 + 0.25]}>
        <meshStandardMaterial color="#8B7355" roughness={0.8} />
      </Box>
      <Box args={[length + 0.5, 0.5, 0.5]} position={[0, 0.75, -(width/2 + 0.25)]}>
        <meshStandardMaterial color="#8B7355" roughness={0.8} />
      </Box>
      <Box args={[0.5, 0.5, width]} position={[length/2 + 0.25, 0.75, 0]}>
        <meshStandardMaterial color="#8B7355" roughness={0.8} />
      </Box>
      <Box args={[0.5, 0.5, width]} position={[-(length/2 + 0.25), 0.75, 0]}>
        <meshStandardMaterial color="#8B7355" roughness={0.8} />
      </Box>
      
      {/* Beautiful house structure */}
      <Box args={[length - 2, 8, width - 2]} position={[0, 4.5, 0]}>
        <meshStandardMaterial 
          color="#E6D3B7" 
          roughness={0.4}
          metalness={0.1}
        />
      </Box>
      
      {/* Attractive roof with gradient-like effect */}
      <Box args={[length, 3, width]} position={[0, 9.5, 0]}>
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.6}
          metalness={0.2}
        />
      </Box>
      
      {/* Underground foundation visualization - this is the wow factor! */}
      <Box args={[length, estimated_depth, width]} position={[0, -(estimated_depth/2 + 0.5), 0]}>
        <meshStandardMaterial 
          color="#8B7D6B" 
          opacity={0.8} 
          transparent 
          roughness={0.9}
        />
      </Box>
      
      {/* Cross-section view indicator */}
      <Box args={[length + 2, 0.1, width + 2]} position={[0, -0.5, 0]}>
        <meshStandardMaterial 
          color="#F4A460" 
          opacity={0.6} 
          transparent 
        />
      </Box>
      
      {/* Beautiful ground plane */}
      <Plane args={[50, 50]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <meshStandardMaterial color="#7FB069" opacity={0.4} transparent />
      </Plane>
      
      {/* Blueprint overlay if available */}
      {blueprint && (
        <Plane args={[length, width]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.52, 0]}>
          <meshBasicMaterial 
            map={getBlueprintTexture()}
            transparent 
            opacity={0.3}
          />
        </Plane>
      )}
      
      {/* Decorative elements for visual appeal - but only a few to save memory */}
      <Sphere args={[0.2]} position={[length/2 - 1, 1.2, width/2 - 1]}>
        <meshStandardMaterial color="#90EE90" />
      </Sphere>
      <Sphere args={[0.15]} position={[-length/2 + 1, 1.1, -width/2 + 1]}>
        <meshStandardMaterial color="#90EE90" />
      </Sphere>
    </group>
  );
}

function ClientPierComponent({ 
  placement, 
  modelData
}: { 
  placement: PierPlacement;
  modelData: GeneratedModelData;
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
  
  const getPierName = (type: string) => {
    switch (type) {
      case "push_pier": return "Push Pier";
      case "helical_pier": return "Helical Pier"; 
      case "steel_pier": return "Steel Pier";
      default: return "Foundation Pier";
    }
  };
  
  // Beautiful pier with premium materials
  const pierColor = getPierColor(placement.type);
  
  return (
    <group>
      {/* Main pier shaft with premium finish */}
      <Box
        ref={meshRef}
        args={[0.8, 6, 0.8]}
        position={[placement.x, placement.y - 3, placement.z]}
      >
        <meshStandardMaterial 
          color={pierColor}
          metalness={0.6}
          roughness={0.3}
        />
      </Box>
      
      {/* Premium pier cap */}
      <Box
        args={[1.2, 0.3, 1.2]}
        position={[placement.x, placement.y + 0.15, placement.z]}
      >
        <meshStandardMaterial 
          color={pierColor} 
          metalness={0.8} 
          roughness={0.2}
        />
      </Box>
      
      {/* Underground pier extension - the impressive part! */}
      <Box
        args={[0.6, modelData.foundation_dimensions.estimated_depth, 0.6]}
        position={[placement.x, -(modelData.foundation_dimensions.estimated_depth/2 + 0.5), placement.z]}
      >
        <meshStandardMaterial 
          color={pierColor}
          transparent={true}
          opacity={0.7}
          metalness={0.9}
          roughness={0.1}
        />
      </Box>
      
      {/* Pier connection point indicator */}
      <Sphere
        args={[0.3]}
        position={[placement.x, 0.8, placement.z]}
      >
        <meshStandardMaterial 
          color="#FFD700"
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      
      {/* Client-friendly pier label - only show for first few piers to avoid clutter */}
      {placement.x < 10 && placement.z < 10 && (
        <Html position={[placement.x, placement.y + 2.5, placement.z]} center>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium pointer-events-none">
            {getPierName(placement.type)}
            <div className="text-xs opacity-90 mt-1">
              Professional Foundation Support
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function CameraController() {
  const { camera } = useThree();
  
  useEffect(() => {
    // Perfect presentation angle for client viewing
    camera.position.set(35, 25, 35);
    camera.lookAt(0, 3, 0);
  }, [camera]);
  
  return null;
}

function PresentationScene({ 
  modelData, 
  pierPlacements, 
  blueprint 
}: { 
  modelData: GeneratedModelData;
  pierPlacements: PierPlacements;
  blueprint?: string;
}) {
  return (
    <>
      <CameraController />
      
      {/* Beautiful presentation lighting - optimized for performance */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[20, 30, 20]} 
        intensity={1.2} 
        castShadow={false} // Disable shadows for better performance
      />
      <pointLight position={[-20, 25, -20]} intensity={0.4} color="#87CEEB" />
      <pointLight position={[20, 25, 20]} intensity={0.4} color="#F0E68C" />
      
      {/* Client's foundation with their house */}
      <ClientFoundation 
        modelData={modelData} 
        blueprint={blueprint} 
      />
      
      {/* Professional pier installation - limit rendering for performance */}
      {pierPlacements.slice(0, 100).map((placement) => (
        <ClientPierComponent
          key={placement.id}
          placement={placement}
          modelData={modelData}
        />
      ))}
      
      {/* Smooth, client-friendly camera controls */}
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        minDistance={20}
        maxDistance={100}
        target={[0, 4, 0]}
        enableDamping={true}
        dampingFactor={0.08}
        autoRotate={true}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

export default function Generated3DModel({ 
  modelData, 
  pierPlacements, 
  blueprint 
}: Generated3DModelProps) {
  const [contextLost, setContextLost] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [memoryWarning, setMemoryWarning] = useState(false);
  
  // Memory monitoring for client presentation
  useEffect(() => {
    const checkMemory = () => {
      const isHighMemory = clientMemoryManager.checkMemory();
      setMemoryWarning(isHighMemory);
    };
    
    // Check memory every 45 seconds for client presentation
    const memoryInterval = setInterval(checkMemory, 45000);
    
    return () => {
      clearInterval(memoryInterval);
    };
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clientMemoryManager.clearCache();
    };
  }, []);
  
  // WebGL support check
  const checkWebGLSupport = useCallback(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        console.warn("WebGL not supported by browser for client presentation");
        return false;
      }
      
      const webglContext = gl as WebGLRenderingContext;
      
      // Test basic WebGL functionality
      try {
        const version = webglContext.getParameter(webglContext.VERSION);
        const vendor = webglContext.getParameter(webglContext.VENDOR);
        if (!version || !vendor) {
          console.warn("WebGL context appears non-functional for client presentation");
          return false;
        }
        
        // Test shader precision format
        try {
          const precisionFormat = webglContext.getShaderPrecisionFormat(webglContext.VERTEX_SHADER, webglContext.HIGH_FLOAT);
          if (!precisionFormat) {
            console.warn("WebGL shader precision test failed for client presentation");
            return false;
          }
        } catch (precisionError) {
          console.warn("Shader precision test failed for client presentation:", precisionError);
          return false;
        }
        
        return true;
      } catch (testError) {
        console.warn("WebGL functionality test failed for client presentation:", testError);
        return false;
      }
    } catch (error) {
      console.warn("WebGL support check failed for client presentation:", error);
      return false;
    }
  }, []);

  // Check WebGL support on mount
  useEffect(() => {
    const isSupported = checkWebGLSupport();
    setWebglSupported(isSupported);
    
    if (!isSupported) {
      console.warn("WebGL not supported for client presentation - showing fallback");
      setContextLost(true);
    }
  }, [checkWebGLSupport]);
  
  if (!modelData || !modelData.generated) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 rounded-lg">
        <div className="text-center p-8">
          <div className="text-4xl mb-4">🏠</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">3D Presentation Ready</h3>
          <p className="text-slate-600 text-sm">
            Generate your 3D model to show clients their foundation solution
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <Enhanced3DErrorBoundary>
      <div className="h-full w-full relative bg-gradient-to-b from-blue-50 to-indigo-100 rounded-lg overflow-hidden">
        {/* Memory Warning for Client Presentation */}
        {memoryWarning && (
          <div className="absolute top-2 left-2 right-2 z-50 bg-orange-100 border border-orange-300 rounded-lg p-2">
            <div className="text-orange-800 text-xs font-medium">
              ⚠️ High memory usage in presentation mode. Performance may be affected.
            </div>
          </div>
        )}
        
        {(contextLost || !webglSupported) ? (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white/95 rounded-xl p-6 shadow-xl max-w-md text-center">
              <h3 className="font-semibold text-lg text-slate-900 mb-2">
                {!webglSupported ? '3D Presentation Not Supported' : '3D Presentation Unavailable'}
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                {!webglSupported 
                  ? "Your browser or device doesn't support 3D graphics for the client presentation. The technical data is still available."
                  : "The 3D presentation viewer encountered an error. Please refresh to restore."
                }
              </p>
              <div className="text-left text-sm">
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Foundation Details:</h4>
                  <div className="space-y-1 text-blue-800">
                    <div>Size: {modelData.foundation_dimensions.length}' × {modelData.foundation_dimensions.width}'</div>
                    <div>Depth: {modelData.foundation_dimensions.estimated_depth}+ feet</div>
                    <div>Piers: {pierPlacements.length} units</div>
                    {pierPlacements.length > 100 && (
                      <div className="text-orange-600">Note: Large project ({pierPlacements.length} piers)</div>
                    )}
                  </div>
                </div>
              </div>
              {webglSupported && (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      clientMemoryManager.clearCache();
                      window.location.reload();
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Cache & Refresh
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
            camera={{ position: [35, 25, 35], fov: 60 }}
            shadows={false} // Disable shadows for client presentation performance
            gl={{ 
              preserveDrawingBuffer: false,
              powerPreference: "default",
              antialias: pierPlacements.length < 50, // Disable antialiasing for large projects
              alpha: false,
              failIfMajorPerformanceCaveat: false,
              precision: "mediump",
            }}
            frameloop={pierPlacements.length > 100 ? "demand" : "always"} // Demand rendering for large projects
            resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
            onCreated={({ gl, scene }) => {
              try {
                const context = gl.getContext() as WebGLRenderingContext;
                
                // Enhanced context validation for client presentation
                if (!context || !gl || !gl.domElement) {
                  console.error("WebGL context/renderer not available in Generated3DModel");
                  setContextLost(true);
                  return;
                }
                
                // Check if context is already lost
                try {
                  if (context.isContextLost && context.isContextLost()) {
                    console.warn("WebGL context already lost in Generated3DModel");
                    setContextLost(true);
                    return;
                  }
                } catch (contextCheckError) {
                  console.error("Context loss check failed in Generated3DModel:", contextCheckError);
                  setContextLost(true);
                  return;
                }

                // Memory-conscious setup for client presentation
                try {
                  const pixelRatio = Math.min(window.devicePixelRatio || 1, pierPlacements.length > 50 ? 1 : 1.5);
                  gl.setPixelRatio(pixelRatio);
                  
                  // Disable shadows for performance
                  if (gl.shadowMap) {
                    gl.shadowMap.enabled = false;
                  }
                  
                  console.log(`Client presentation initialized with ${pierPlacements.length} piers`);
                } catch (setupError) {
                  console.warn("WebGL setup warning in Generated3DModel:", setupError);
                }
                
                // Enhanced context loss handling for client presentation
                const handleContextLost = (event: Event) => {
                  event.preventDefault();
                  console.warn("WebGL context lost in client presentation - graceful handling");
                  setContextLost(true);
                  
                  // Clear client texture cache immediately
                  clientMemoryManager.clearCache();
                  
                  // Stop all Three.js operations immediately
                  try {
                    if (gl && gl.setAnimationLoop) {
                      gl.setAnimationLoop(null);
                    }
                    if (scene) {
                      clientMemoryManager.disposeObject(scene);
                    }
                  } catch (error) {
                    console.warn("Client presentation cleanup error (expected):", error);
                  }
                };
                
                const handleContextRestored = () => {
                  console.log("WebGL context restored in client presentation");
                  // Clear cache and start fresh
                  clientMemoryManager.clearCache();
                  
                  // Longer delay for client presentation to ensure stability
                  setTimeout(() => {
                    try {
                      if (checkWebGLSupport()) {
                        setContextLost(false);
                        setWebglSupported(true);
                      }
                    } catch (error) {
                      console.warn("Context restoration error in client presentation:", error);
                    }
                  }, 3000);
                };
                
                if (gl.domElement) {
                  gl.domElement.addEventListener('webglcontextlost', handleContextLost, false);
                  gl.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);
                  
                  // Cleanup on unmount
                  return () => {
                    gl.domElement.removeEventListener('webglcontextlost', handleContextLost);
                    gl.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
                    
                    // Comprehensive cleanup for client presentation
                    if (scene) {
                      clientMemoryManager.disposeObject(scene);
                    }
                    clientMemoryManager.clearCache();
                  };
                }
                
              } catch (error) {
                console.error("WebGL initialization failed in Generated3DModel:", error);
                setContextLost(true);
                setWebglSupported(false);
              }
            }}
          >
            <Suspense fallback={
              <Html center>
                <div className="bg-white/90 rounded-lg p-4 shadow-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                  <div className="text-sm text-slate-600">Loading Your 3D Presentation...</div>
                  {pierPlacements.length > 50 && (
                    <div className="text-xs text-orange-600 mt-1">Large project - this may take a moment</div>
                  )}
                </div>
              </Html>
            }>
              <PresentationScene 
                modelData={modelData} 
                pierPlacements={pierPlacements} 
                blueprint={blueprint} 
              />
            </Suspense>
          </Canvas>
        )}
        
        {/* Client-Friendly Info Panel */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-slate-200 min-w-[280px]">
          <h4 className="font-semibold text-sm mb-4 text-slate-900 flex items-center">
            🏠 Your Foundation Solution
          </h4>
          
          <div className="space-y-3 text-sm">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3">
              <div className="font-medium text-green-800 mb-1">✓ Professional Installation</div>
              <div className="text-green-700 text-xs">
                {pierPlacements.length} strategically placed foundation piers
                {pierPlacements.length > 100 && " (large project)"}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-slate-700 font-medium">Foundation Details:</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Foundation Size:</span>
                  <span className="font-medium">{modelData.foundation_dimensions.length}' × {modelData.foundation_dimensions.width}'</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pier Depth:</span>
                  <span className="font-medium">{modelData.foundation_dimensions.estimated_depth}+ feet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Piers:</span>
                  <span className="font-medium">{pierPlacements.length} units</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
              <div className="text-blue-700 text-xs">
                <div className="font-medium">💎 Premium Solution</div>
                <div className="mt-1">
                  State-of-the-art foundation repair designed specifically for your home
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Presentation Controls */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-xl border border-slate-200">
          <div className="text-xs text-slate-600">
            <div className="font-medium text-slate-900 mb-2">🎯 Interactive 3D View</div>
            <div className="space-y-1">
              <div>• Drag to rotate and explore</div>
              <div>• Scroll to zoom in/out</div>
              <div>• See your piers installed below</div>
              {pierPlacements.length > 100 && (
                <div className="text-orange-600">• Performance optimized for large projects</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Wow Factor Badge */}
        <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg">
          <div className="font-bold text-sm">✨ Your Custom 3D Model</div>
        </div>
      </div>
    </Enhanced3DErrorBoundary>
  );
}
