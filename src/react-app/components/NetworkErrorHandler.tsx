import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

interface NetworkErrorHandlerProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

type NetworkStatus = 'online' | 'offline' | 'slow' | 'reconnecting' | 'error';

export default function NetworkErrorHandler({ children, onRetry }: NetworkErrorHandlerProps) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('online');
  const [showBanner, setShowBanner] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'fast' | 'slow' | 'poor'>('fast');
  const [lastError, setLastError] = useState<string | null>(null);

  // Network status detection
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network: Back online');
      setNetworkStatus('reconnecting');
      setShowBanner(true);
      
      // Test connection quality
      testConnectionQuality().then(quality => {
        setConnectionQuality(quality);
        setNetworkStatus('online');
        
        // Hide banner after successful reconnection
        setTimeout(() => setShowBanner(false), 3000);
      }).catch(() => {
        setNetworkStatus('slow');
      });
    };

    const handleOffline = () => {
      console.log('Network: Gone offline');
      setNetworkStatus('offline');
      setShowBanner(true);
      setLastError('Internet connection lost');
    };

    // Enhanced connection quality testing
    const testConnectionQuality = async (): Promise<'fast' | 'slow' | 'poor'> => {
      try {
        const start = Date.now();
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        const duration = Date.now() - start;

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (duration < 500) return 'fast';
        if (duration < 2000) return 'slow';
        return 'poor';
      } catch (error) {
        console.warn('Connection quality test failed:', error);
        return 'poor';
      }
    };

    // Periodic connection monitoring
    const connectionMonitor = setInterval(async () => {
      if (navigator.onLine) {
        try {
          const quality = await testConnectionQuality();
          setConnectionQuality(quality);
          
          if (networkStatus === 'offline' || networkStatus === 'error') {
            setNetworkStatus('online');
            setShowBanner(true);
            setTimeout(() => setShowBanner(false), 2000);
          }
        } catch (error) {
          console.warn('Connection monitor detected issues:', error);
          if (networkStatus === 'online') {
            setNetworkStatus('slow');
            setShowBanner(true);
            setLastError('Connection issues detected');
          }
        }
      }
    }, 10000); // Check every 10 seconds

    // Listen for browser network events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectionMonitor);
    };
  }, [networkStatus]);

  // Global error handler for fetch failures
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Reset error state on successful requests
        if (response.ok && (networkStatus === 'error' || networkStatus === 'slow')) {
          setNetworkStatus('online');
          setLastError(null);
        }
        
        return response;
      } catch (error) {
        console.error('Fetch intercepted error:', error);
        
        // Network error detection
        if (error instanceof TypeError && error.message.includes('Load failed')) {
          setNetworkStatus('error');
          setLastError('Failed to load data - connection interrupted');
          setShowBanner(true);
        }
        
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [networkStatus]);

  const handleRetry = useCallback(() => {
    setNetworkStatus('reconnecting');
    setLastError(null);
    
    if (onRetry) {
      onRetry();
    } else {
      // Default retry behavior
      window.location.reload();
    }
  }, [onRetry]);

  const handleDismiss = () => {
    setShowBanner(false);
    setLastError(null);
  };

  const getStatusConfig = () => {
    switch (networkStatus) {
      case 'offline':
        return {
          icon: <WifiOff className="w-5 h-5" />,
          title: 'No Internet Connection',
          message: 'Please check your connection and try again',
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          showRetry: false
        };
      
      case 'slow':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Slow Connection',
          message: connectionQuality === 'poor' ? 'Very slow connection detected' : 'Connection quality is degraded',
          bgColor: 'bg-amber-500',
          textColor: 'text-white',
          showRetry: true
        };
      
      case 'error':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Connection Error',
          message: lastError || 'Failed to load data',
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          showRetry: true
        };
      
      case 'reconnecting':
        return {
          icon: <RefreshCw className="w-5 h-5 animate-spin" />,
          title: 'Reconnecting...',
          message: 'Restoring connection',
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          showRetry: false
        };
      
      case 'online':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          title: 'Connection Restored',
          message: 'Back online and ready to go',
          bgColor: 'bg-green-500',
          textColor: 'text-white',
          showRetry: false
        };
      
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <>
      {children}
      
      {/* Network Status Banner */}
      {showBanner && statusConfig && (
        <div className={`fixed top-0 left-0 right-0 z-50 ${statusConfig.bgColor} ${statusConfig.textColor} px-4 py-3 shadow-lg transform transition-transform duration-300 ease-in-out`}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              {statusConfig.icon}
              <div>
                <div className="font-semibold text-sm">{statusConfig.title}</div>
                <div className="text-xs opacity-90">{statusConfig.message}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {statusConfig.showRetry && (
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Retry
                </button>
              )}
              
              <button
                onClick={handleDismiss}
                className="text-white/80 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Connection Quality Indicator */}
      {networkStatus === 'online' && connectionQuality !== 'fast' && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-amber-100 border border-amber-300 rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center space-x-2 text-amber-800">
              <Wifi className="w-4 h-4" />
              <span className="text-sm">
                {connectionQuality === 'slow' ? 'Slow connection' : 'Poor connection'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
