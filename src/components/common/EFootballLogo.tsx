import React, { useState } from 'react';

export const EFOOTBALL_LOGO_URL =
  'https://images.seeklogo.com/logo-png/45/1/efootball-logo-png_seeklogo-451310.png';
export const EFOOTBALL_LOGO_FALLBACK = '/efootball-logo.png';

interface EFootballLogoProps {
  className?: string;
  theme?: 'dark' | 'light';
  showBadge?: boolean;
}

/**
 * Official eFootball™ Logo by KONAMI
 * Uses the requested official logo asset:
 * https://images.seeklogo.com/logo-png/45/1/efootball-logo-png_seeklogo-451310.png
 */
export const EFootballLogo: React.FC<EFootballLogoProps> = ({
  className = 'h-7 w-auto',
  showBadge = false,
}) => {
  const [imgSrc, setImgSrc] = useState(EFOOTBALL_LOGO_URL);

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <img
        src={imgSrc}
        alt="eFootball™ Official Logo"
        referrerPolicy="no-referrer"
        onError={() => setImgSrc(EFOOTBALL_LOGO_FALLBACK)}
        className="h-7 sm:h-8 w-auto object-contain filter drop-shadow-sm"
      />
      {showBadge && (
        <span className="text-[8px] font-bold uppercase tracking-widest text-[#22c55e] hidden sm:inline">
          Official Title
        </span>
      )}
    </div>
  );
};

