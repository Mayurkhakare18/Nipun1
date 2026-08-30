import React from 'react';

interface NipunLogoProps {
  variant?: 'full' | 'mark' | 'horizontal' | 'compact';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showSubtitle?: boolean;
  showTagline?: boolean;
  lightModeText?: boolean;
  onClick?: () => void;
}

export const NipunLogo: React.FC<NipunLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showSubtitle = true,
  showTagline = false,
  lightModeText = false,
  onClick,
}) => {
  const getIconDimensions = () => {
    if (typeof size === 'number') return { w: size, h: size };
    switch (size) {
      case 'xs':
        return { w: 24, h: 24 };
      case 'sm':
        return { w: 32, h: 32 };
      case 'lg':
        return { w: 56, h: 56 };
      case 'xl':
        return { w: 84, h: 84 };
      case 'md':
      default:
        return { w: 42, h: 42 };
    }
  };

  const { w, h } = getIconDimensions();

  // Emblem vector component
  const LogoEmblem = ({ width = w, height = h }: { width?: number; height?: number }) => (
    <svg
      viewBox="0 0 320 320"
      width={width}
      height={height}
      className="shrink-0 select-none drop-shadow-xs"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="emblemNBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#001F54" />
          <stop offset="45%" stopColor="#0047AB" />
          <stop offset="85%" stopColor="#0077B6" />
          <stop offset="100%" stopColor="#00B4D8" />
        </linearGradient>
        <linearGradient id="emblemCyanSwoosh" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0096C7" />
          <stop offset="50%" stopColor="#00B4D8" />
          <stop offset="100%" stopColor="#48CAE4" />
        </linearGradient>
        <linearGradient id="barG1" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#0077B6" />
          <stop offset="100%" stopColor="#00B4D8" />
        </linearGradient>
        <linearGradient id="barG2" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#0096C7" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
        <linearGradient id="barG3" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#00A86B" />
          <stop offset="100%" stopColor="#00E676" />
        </linearGradient>
        <linearGradient id="barG4" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#2E7D32" />
          <stop offset="100%" stopColor="#76FF03" />
        </linearGradient>
      </defs>

      <g transform="translate(-80, -20)">
        {/* 1. Ascending Statistical Growth Bars */}
        <rect x="268" y="160" width="22" height="110" rx="3" fill="url(#barG1)" />
        <rect x="298" y="130" width="22" height="140" rx="3" fill="url(#barG2)" />
        <rect x="328" y="100" width="22" height="170" rx="3" fill="url(#barG3)" />
        <rect x="358" y="65" width="22" height="205" rx="3" fill="url(#barG4)" />

        {/* 2. Human Profile Silhouette (Right Facing in Navy) */}
        <path
          d="M 320 185
             C 345 185, 375 195, 385 220
             C 390 230, 395 238, 388 244
             C 382 248, 385 254, 392 258
             C 395 260, 388 266, 380 268
             C 382 274, 386 280, 378 285
             C 365 292, 345 300, 325 295
             C 305 290, 300 270, 300 245
             C 300 215, 308 185, 320 185 Z"
          fill="#001F54"
        />

        {/* Neural Network Inside Head */}
        <line x1="328" y1="240" x2="345" y2="225" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.95" />
        <line x1="345" y1="225" x2="365" y2="235" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.95" />
        <line x1="328" y1="240" x2="335" y2="260" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.95" />
        <line x1="335" y1="260" x2="355" y2="268" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.95" />
        <line x1="345" y1="225" x2="355" y2="268" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.95" />
        <line x1="365" y1="235" x2="355" y2="268" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.95" />
        <line x1="345" y1="225" x2="335" y2="260" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.95" />

        <circle cx="328" cy="240" r="4.5" fill="#FFFFFF" />
        <circle cx="345" cy="225" r="4.5" fill="#FFFFFF" />
        <circle cx="365" cy="235" r="4.5" fill="#FFFFFF" />
        <circle cx="335" cy="260" r="4.5" fill="#FFFFFF" />
        <circle cx="355" cy="268" r="5.5" fill="#FFFFFF" />

        {/* 3. Outer Cyan/Teal Arc Swoosh */}
        <path
          d="M 285 240
             C 330 200, 375 140, 388 95
             C 388 125, 365 195, 305 248
             Z"
          fill="url(#emblemCyanSwoosh)"
          opacity="0.95"
        />

        {/* 4. Main Letter 'N' Structure */}
        <path d="M 160 145 L 205 145 L 205 305 L 160 305 Z" fill="#001F54" />
        <path
          d="M 160 145
             C 210 155, 270 215, 320 270
             C 345 295, 360 310, 370 312
             C 350 312, 310 285, 260 230
             C 225 192, 195 160, 160 145 Z"
          fill="url(#emblemNBlue)"
        />
        <path
          d="M 230 205
             C 275 255, 325 315, 370 312
             C 340 312, 290 280, 245 235
             C 240 230, 235 225, 230 205 Z"
          fill="#0047AB"
          opacity="0.85"
        />

        {/* 5. Academic Graduation Cap */}
        <polygon points="182,108 235,130 182,148 130,130" fill="#001F54" stroke="#FFFFFF" strokeWidth="1.5" />
        <polygon points="182,112 230,130 182,144 135,130" fill="#002D72" />
        <path d="M 155 137 Q 182 148 210 137 L 210 145 Q 182 156 155 145 Z" fill="#001A4D" />
        <circle cx="182" cy="128" r="3.5" fill="#001A4D" />
        <path d="M 182 128 C 160 130, 140 140, 138 160" stroke="#001A4D" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="138" cy="162" r="3" fill="#001A4D" />
        <polygon points="135,164 141,164 143,178 133,178" fill="#001A4D" />
      </g>
    </svg>
  );

  if (variant === 'mark') {
    return (
      <div onClick={onClick} className={`inline-flex items-center justify-center ${className}`}>
        <LogoEmblem />
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div onClick={onClick} className={`flex flex-col items-center text-center select-none ${className}`}>
        <LogoEmblem width={typeof size === 'number' ? size : 120} height={typeof size === 'number' ? size : 120} />
        
        {/* N I P U N Wordmark */}
        <div className="mt-2 flex items-center justify-center tracking-[0.18em] font-black text-2xl sm:text-3xl text-[#001F54]">
          <span>N</span>
          <span className="relative mx-1 inline-flex flex-col items-center">
            <span className="w-2.5 h-1.5 bg-[#00C853] rounded-xs mb-0.5" />
            <span>I</span>
          </span>
          <span>PUN</span>
        </div>

        {showSubtitle && (
          <div className="mt-1 flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-[0.25em] text-[#001F54] uppercase">
            <span>LEARN</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C853]" />
            <span>GROW</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C853]" />
            <span>EXCEL</span>
          </div>
        )}

        {showTagline && (
          <div className="mt-2 text-[9px] sm:text-[10px] font-semibold tracking-wider text-[#44474E] uppercase border-t border-[#c4c6cf]/40 pt-1.5 px-4">
            AI-Powered Competency Intelligence Platform
          </div>
        )}
      </div>
    );
  }

  // Default: Horizontal Layout
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <LogoEmblem />

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <div className={`font-['Public_Sans',sans-serif] font-black tracking-tight flex items-center ${
            size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg sm:text-xl'
          } ${lightModeText ? 'text-white' : 'text-[#001F54]'}`}>
            <span>N</span>
            <span className="relative mx-0.5 inline-flex flex-col items-center">
              <span className="w-1.5 h-1 bg-[#00C853] rounded-xs mb-px" />
              <span>I</span>
            </span>
            <span>PUN</span>
          </div>

          <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-md bg-[#00C853]/15 text-[#0047AB] border border-[#00C853]/30 hidden sm:inline-block">
            MoSPI
          </span>
        </div>

        {showSubtitle && (
          <p className={`text-[10px] font-semibold tracking-wide ${lightModeText ? 'text-white/80' : 'text-[#555964]'} hidden sm:block`}>
            National Statistical Competency Platform
          </p>
        )}
      </div>
    </div>
  );
};
