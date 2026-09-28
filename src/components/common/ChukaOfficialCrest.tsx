import React, { useState } from 'react';

export const CHUKA_CREST_URL =
  'https://aicenter.chuka.ac.ke/wp-content/uploads/2026/03/chuka-uni-logo-HD-1-2-Photoroom.png';
export const CHUKA_CREST_FALLBACK = '/chuka-crest.png';

interface ChukaOfficialCrestProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTitle?: boolean;
  theme?: 'dark' | 'light';
}

/**
 * Chuka Official Crest Component
 * Displays the authentic Chuka University crest:
 * https://aicenter.chuka.ac.ke/wp-content/uploads/2026/03/chuka-uni-logo-HD-1-2-Photoroom.png
 */
export const ChukaOfficialCrest: React.FC<ChukaOfficialCrestProps> = ({
  className = '',
  size = 'md',
  showTitle = false,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [imgSrc, setImgSrc] = useState(CHUKA_CREST_URL);

  const sizeClasses = {
    sm: 'w-8 h-8 sm:w-10 sm:h-10',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-24 h-24 sm:w-32 sm:h-32',
    xl: 'w-40 h-40 sm:w-52 sm:h-52',
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div className="relative group flex-shrink-0">
        {/* Esports ambient backlight */}
        <div className="absolute inset-0 rounded-2xl bg-[#22c55e]/30 blur-xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Crest Frame */}
        <div
          className={`relative ${sizeClasses} rounded-2xl p-1 bg-gradient-to-b from-[#22c55e]/40 via-transparent to-[#22c55e]/20 border-2 border-[#22c55e]/60 shadow-lg overflow-hidden flex items-center justify-center`}
        >
          <img
            src={imgSrc}
            alt="Chuka Official Crest"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain rounded-xl drop-shadow-md"
            onError={() => {
              if (imgSrc !== CHUKA_CREST_FALLBACK) {
                setImgSrc(CHUKA_CREST_FALLBACK);
              }
            }}
          />
        </div>
      </div>


      {showTitle && (
        <div className="flex flex-col text-left">
          <span
            className="text-xs font-black uppercase tracking-widest text-[#22c55e]"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            Chuka Official Crest
          </span>
          <span
            className={`text-sm sm:text-base font-extrabold uppercase ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            Chuka University eFootball
          </span>
        </div>
      )}
    </div>
  );
};
