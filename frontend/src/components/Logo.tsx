import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        className={`${sizeClasses[size]} text-blue-600`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer hexagon */}
        <polygon
          points="50,10 85,30 85,70 50,90 15,70 15,30"
          fill="currentColor"
          opacity="0.1"
        />
        {/* Inner hexagon */}
        <polygon
          points="50,20 75,35 75,65 50,80 25,65 25,35"
          fill="currentColor"
          opacity="0.2"
        />
        {/* Center nexus point */}
        <circle
          cx="50"
          cy="50"
          r="8"
          fill="currentColor"
        />
        {/* Connecting lines */}
        <line
          x1="50"
          y1="20"
          x2="50"
          y2="42"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.6"
        />
        <line
          x1="75"
          y1="35"
          x2="58"
          y2="45"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.6"
        />
        <line
          x1="75"
          y1="65"
          x2="58"
          y2="55"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.6"
        />
        <line
          x1="50"
          y1="80"
          x2="50"
          y2="58"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.6"
        />
        <line
          x1="25"
          y1="65"
          x2="42"
          y2="55"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.6"
        />
        <line
          x1="25"
          y1="35"
          x2="42"
          y2="45"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.6"
        />
      </svg>
    </div>
  );
};

export default Logo;