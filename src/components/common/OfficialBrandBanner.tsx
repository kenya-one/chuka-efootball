import React from 'react';
import { KonamiLogo } from './KonamiLogo';
import { EFootballLogo } from './EFootballLogo';
import { ChukaOfficialCrest } from './ChukaOfficialCrest';

interface OfficialBrandBannerProps {
  theme?: 'dark' | 'light';
  variant?: 'compact' | 'full';
  className?: string;
}

/**
 * Official Brand Accreditation Banner
 * Combines:
 * 1. Chuka Official Crest
 * 2. KONAMI Official Logo
 * 3. eFootball™ Official Logo
 */
export const OfficialBrandBanner: React.FC<OfficialBrandBannerProps> = ({
  theme = 'dark',
  variant = 'compact',
  className = '',
}) => {
  const isDark = theme === 'dark';

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-3 sm:gap-4 px-3.5 py-1.5 rounded-2xl border backdrop-blur-md transition-all ${
          isDark
            ? 'bg-black/40 border-white/10 text-gray-300 shadow-inner'
            : 'bg-white/80 border-gray-200 text-gray-700 shadow-sm'
        } ${className}`}
      >
        <ChukaOfficialCrest size="sm" theme={theme} />
        <div className={`h-4 w-px ${isDark ? 'bg-white/15' : 'bg-gray-300'}`} />
        <KonamiLogo className="h-4 sm:h-4.5" />
        <div className={`h-4 w-px ${isDark ? 'bg-white/15' : 'bg-gray-300'}`} />
        <EFootballLogo theme={theme} className="scale-90" />
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-xl mx-auto p-4 sm:p-5 rounded-3xl border flex flex-col items-center gap-3 text-center transition-all ${
        isDark
          ? 'bg-[#0f1511]/90 border-white/10 shadow-[0_0_30px_rgba(34,197,94,0.08)]'
          : 'bg-white border-gray-200 shadow-md'
      } ${className}`}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#22c55e]">
        Official League Federation & Title Accreditation
      </span>
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <ChukaOfficialCrest size="md" theme={theme} />
          <div className="text-left leading-tight hidden sm:block">
            <span className="text-[10px] font-semibold text-gray-400 block">Host Institution</span>
            <span className="text-xs font-bold uppercase text-white">Chuka University</span>
          </div>
        </div>

        <div className={`h-8 w-px hidden sm:block ${isDark ? 'bg-white/15' : 'bg-gray-300'}`} />

        <div className="flex items-center gap-2">
          <KonamiLogo className="h-6" />
          <div className="text-left leading-tight hidden sm:block">
            <span className="text-[10px] font-semibold text-gray-400 block">Game Publisher</span>
            <span className="text-xs font-bold uppercase text-white">Konami Digital Ent.</span>
          </div>
        </div>

        <div className={`h-8 w-px hidden sm:block ${isDark ? 'bg-white/15' : 'bg-gray-300'}`} />

        <div className="flex items-center gap-2">
          <EFootballLogo theme={theme} showBadge />
        </div>
      </div>
    </div>
  );
};
