import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  fullScreen = false 
}) => {
  const containerClass = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 backdrop-blur-sm z-50'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-4">
        {/* Animated Spinner */}
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          
          {/* Animated gradient ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 border-r-purple-600 rounded-full animate-spin"></div>
          
          {/* Inner rotating dot */}
          <div className="absolute inset-2 border-2 border-transparent border-b-blue-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Loading message with gradient text */}
        {message && (
          <p className="text-center">
            <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {message}
            </span>
          </p>
        )}

        {/* Animated dots */}
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
          <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 2s linear infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-0.5rem); opacity: 1; }
        }
        .animate-bounce {
          animation: bounce 1.4s infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
