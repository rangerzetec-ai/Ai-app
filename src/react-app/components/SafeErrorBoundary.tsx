import React from "react";

interface SafeErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

interface SafeErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void; retryCount: number }>;
  maxRetries?: number;
  name?: string;
}

class SafeErrorBoundary extends React.Component<SafeErrorBoundaryProps, SafeErrorBoundaryState> {
  private retryTimeout?: NodeJS.Timeout;
  
  constructor(props: SafeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<SafeErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const componentName = this.props.name || "Unknown Component";
    console.error(`SafeErrorBoundary caught an error in ${componentName}:`, error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Auto-retry for certain types of errors
    if (this.shouldAutoRetry(error) && this.state.retryCount < (this.props.maxRetries || 2)) {
      console.log(`Auto-retrying ${componentName} (attempt ${this.state.retryCount + 1})`);
      this.retryTimeout = setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          retryCount: prevState.retryCount + 1
        }));
      }, 2000 * (this.state.retryCount + 1)); // Exponential backoff
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    const retryableErrors = [
      'Loading chunk',
      'Loading CSS chunk',
      'Loading dynamic import',
      'Network error',
      'fetch',
      'webgl',
      'context'
    ];
    
    return retryableErrors.some(keyword => 
      error.message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  reset = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, retryCount: 0 });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={this.state.error} 
            reset={this.reset}
            retryCount={this.state.retryCount}
          />
        );
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center p-6 max-w-md">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Something went wrong
            </h3>
            <p className="text-red-600 text-sm mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            
            {this.state.retryCount < (this.props.maxRetries || 2) && (
              <p className="text-xs text-red-500 mb-4">
                Retry attempt {this.state.retryCount} of {this.props.maxRetries || 2}
              </p>
            )}
            
            <div className="space-y-2">
              <button
                onClick={this.reset}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
            
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-red-700 hover:text-red-800">
                Show Technical Details
              </summary>
              <div className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 font-mono overflow-auto max-h-40">
                <div className="mb-2">
                  <strong>Error:</strong> {this.state.error?.message}
                </div>
                <div className="mb-2">
                  <strong>Component:</strong> {this.props.name || "Unknown"}
                </div>
                {this.state.error?.stack && (
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap text-xs mt-1">
                      {this.state.error.stack.slice(0, 500)}...
                    </pre>
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundary for 3D components with WebGL-specific handling
export const Enhanced3DErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const FallbackComponent = ({ error, reset, retryCount }: { error?: Error; reset: () => void; retryCount: number }) => {
    const isWebGLError = error?.message.includes('WebGL') || 
                        error?.message.includes('context') || 
                        error?.message.includes('gl.') ||
                        error?.message.includes('getShaderPrecisionFormat') ||
                        error?.message.includes('null is not an object');
    
    const isModuleError = error?.message.includes('Importing a module script failed') ||
                         error?.message.includes('Loading chunk') ||
                         error?.message.includes('Loading CSS chunk');
    
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-slate-50 border border-slate-200 rounded-lg">
        <div className="text-center p-6">
          <div className="text-slate-400 text-4xl mb-4">
            {isWebGLError ? '🎮' : isModuleError ? '📦' : '🔧'}
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {isWebGLError ? '3D Graphics Error' : isModuleError ? 'Module Loading Error' : '3D Viewer Error'}
          </h3>
          <p className="text-slate-600 text-sm mb-4">
            {isWebGLError 
              ? "The 3D graphics engine encountered a WebGL error. This might be due to context loss, shader compilation issues, or browser compatibility problems."
              : isModuleError
                ? "There was an issue loading application modules. This might be due to network issues or hot module replacement problems."
                : "The 3D viewer encountered an error. This might be a temporary issue."
            }
          </p>
          
          {retryCount > 0 && (
            <p className="text-xs text-amber-600 mb-4">
              Auto-retry attempt {retryCount} completed
            </p>
          )}
          
          <div className="space-y-3">
            <button
              onClick={reset}
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isWebGLError ? 'Retry 3D Viewer' : isModuleError ? 'Retry Loading' : 'Try Again'}
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="block w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
          
          {error?.message && (
            <p className="text-xs text-slate-500 mt-3">
              Error: {error.message.slice(0, 100)}...
            </p>
          )}
          
          {isWebGLError && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
              <div className="font-medium mb-1">💡 Troubleshooting Tips:</div>
              <ul className="text-left space-y-1">
                <li>• Try refreshing the page</li>
                <li>• Use the 2D foundation planner instead</li>
                <li>• Update your browser to the latest version</li>
                <li>• Try a different browser (Chrome, Firefox, Safari)</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <SafeErrorBoundary 
      fallback={FallbackComponent}
      maxRetries={3}
      name="Enhanced3DViewer"
    >
      {children}
    </SafeErrorBoundary>
  );
};

// Network error boundary for API-dependent components
export const NetworkErrorBoundary: React.FC<{ children: React.ReactNode; name?: string }> = ({ children, name }) => {
  const FallbackComponent = ({ reset }: { error?: Error; reset: () => void }) => (
    <div className="flex items-center justify-center min-h-[200px] bg-amber-50 border border-amber-200 rounded-lg">
      <div className="text-center p-6">
        <div className="text-amber-600 text-3xl mb-4">📡</div>
        <h3 className="text-lg font-semibold text-amber-800 mb-2">
          Connection Issue
        </h3>
        <p className="text-amber-600 text-sm mb-4">
          Unable to load data. Please check your internet connection.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <SafeErrorBoundary 
      fallback={FallbackComponent}
      maxRetries={3}
      name={name || "NetworkComponent"}
    >
      {children}
    </SafeErrorBoundary>
  );
};

export default SafeErrorBoundary;
