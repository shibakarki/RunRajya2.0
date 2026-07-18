import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to your analytics or console
    console.error('Captured unhandled runtime exception:', error, errorInfo);
  }

  handleHardReset = () => {
    try {
      // 1. Clear local storage configurations
      localStorage.clear();
      sessionStorage.clear();

      // 2. Wipe IndexedDB database caches to resolve local corruption
      const deleteRequest = indexedDB.deleteDatabase('RunRajyaOfflineDB');
      
      deleteRequest.onsuccess = () => {
        window.location.href = '/'; // Hard redirect to clear memory
      };
      deleteRequest.onerror = () => {
        window.location.reload(); // Fallback reload
      };
    } catch (e) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // High-contrast fallback UI aligned with the RunRajya tactical theme
      return (
        <div className="w-full min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full text-center border border-red-900/40 bg-red-950/5 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl">
            <div className="p-3 bg-red-950/20 border border-red-900/50 text-red-500 rounded-full animate-pulse">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-lg font-bold tracking-tight text-white uppercase font-mono">System Telemetry Interrupted</h2>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              An unhandled exception occurred during application initialization. This is commonly caused by corrupted local session tokens or temporary database routing issues.
            </p>

            {this.state.error && (
              <div className="w-full p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-left overflow-x-auto max-h-24">
                <code className="text-[10px] font-mono text-red-400 whitespace-pre-wrap break-all leading-normal">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="flex flex-col gap-2 w-full mt-2">
              <button
                type="button"
                onClick={this.handleHardReset}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold font-mono rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-red-600/10"
              >
                Clear Session Cache & Reset
              </button>
              
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2 bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-mono rounded-xl transition-colors font-semibold"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}