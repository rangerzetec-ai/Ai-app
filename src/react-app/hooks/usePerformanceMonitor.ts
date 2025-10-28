import { useEffect, useRef } from 'react';

// interface PerformanceMetrics {
//   renderTime: number;
//   componentName: string;
//   timestamp: number;
// }

/**
 * Hook to monitor component performance
 * Useful for identifying slow components in development
 */
export function usePerformanceMonitor(componentName: string, enabled = process.env.NODE_ENV === 'development') {
  const renderStartTime = useRef<number>(0);
  const mountTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    mountTime.current = performance.now();
    
    return () => {
      const unmountTime = performance.now();
      const totalTime = unmountTime - mountTime.current;
      
      if (totalTime > 100) { // Only log if component was mounted for more than 100ms
        console.log(`[Performance] ${componentName} mounted for ${totalTime.toFixed(2)}ms`);
      }
    };
  }, [componentName, enabled]);

  const startRender = () => {
    if (enabled) {
      renderStartTime.current = performance.now();
    }
  };

  const endRender = () => {
    if (enabled && renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      
      if (renderTime > 16) { // Only log if render took more than 16ms (60fps threshold)
        console.warn(`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
      
      renderStartTime.current = 0;
    }
  };

  return { startRender, endRender };
}

/**
 * Hook to measure API call performance
 */
export function useApiPerformanceMonitor() {
  const measureApiCall = async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Performance] ${endpoint} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`[API Performance] ${endpoint} failed after ${duration.toFixed(2)}ms:`, error);
      }
      
      throw error;
    }
  };

  return { measureApiCall };
}