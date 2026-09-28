import React, { useState } from 'react';

export const KONAMI_LOGO_URL =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNl7KcbsUyQ1Hd5R5YKTbke6iwy250_Q3NtBjoel70-A&s';
export const KONAMI_LOGO_FALLBACK = '/konami-logo.png';

interface KonamiLogoProps {
  className?: string;
  variant?: 'red-badge' | 'wordmark' | 'monochrome';
}

/**
 * Official KONAMI Logo
 * Uses the requested official asset:
 * https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNl7KcbsUyQ1Hd5R5YKTbke6iwy250_Q3NtBjoel70-A&s
 */
export const KonamiLogo: React.FC<KonamiLogoProps> = ({
  className = 'h-6 w-auto',
}) => {
  const [imgSrc, setImgSrc] = useState(KONAMI_LOGO_URL);

  return (
    <div
      className={`inline-flex items-center justify-center select-none flex-shrink-0 ${className}`}
      title="KONAMI Official Publisher"
    >
      <img
        src={imgSrc}
        alt="KONAMI Official Publisher"
        referrerPolicy="no-referrer"
        onError={() => {
          if (imgSrc !== KONAMI_LOGO_FALLBACK) {
            setImgSrc(KONAMI_LOGO_FALLBACK);
          }
        }}
        className="h-6 sm:h-7 w-auto object-contain rounded filter drop-shadow-sm"
      />
    </div>
  );
};
