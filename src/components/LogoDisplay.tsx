import React, { useState, useRef } from 'react';
import { Upload, Sparkles, RefreshCw } from 'lucide-react';
import { CHUKA_CREST_URL, CHUKA_CREST_FALLBACK } from './common/ChukaOfficialCrest';

interface LogoDisplayProps {
  customLogoUrl: string | null;
  onLogoChange: (url: string | null) => void;
  theme: 'dark' | 'light';
}

export const LogoDisplay: React.FC<LogoDisplayProps> = ({
  customLogoUrl,
  onLogoChange,
  theme,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultLogo = '/logo.jpg';
  const activeLogo = customLogoUrl || defaultLogo;
  const isDark = theme === 'dark';

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      onLogoChange(url);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      id="center-logo-container"
      className="relative flex flex-col items-center justify-center select-none"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {/* Ambient Backlight Glow matching the Neon Lime Theme */}
      <div
        className={`absolute -inset-4 rounded-full blur-3xl opacity-40 transition-opacity duration-700 pointer-events-none ${
          isHovered ? 'opacity-70 scale-105' : 'opacity-35'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(74, 222, 128, 0.45) 0%, rgba(34, 197, 94, 0.2) 45%, transparent 70%)'
            : 'radial-gradient(circle, rgba(74, 222, 128, 0.35) 0%, rgba(34, 197, 94, 0.15) 50%, transparent 70%)',
        }}
      />

      {/* Main Logo Card */}
      <div
        id="logo-image-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative w-64 h-64 sm:w-80 sm:h-80 md:w-92 md:h-92 
          rounded-3xl p-3 transition-all duration-300 transform
          ${isHovered ? 'scale-[1.02]' : 'scale-100'}
          ${
            isDark
              ? 'bg-[#0d120e]/80 border-2 border-[#39ff14]/30 shadow-[0_0_50px_rgba(57,255,20,0.15)]'
              : 'bg-white border-2 border-emerald-500/20 shadow-2xl'
          }
          ${isDragging ? 'ring-4 ring-[#39ff14] border-dashed' : ''}
          overflow-hidden flex items-center justify-center
        `}
      >
        <img
          id="league-logo-img"
          src={activeLogo}
          alt="Chuka eFootball League Crest Logo"
          referrerPolicy="no-referrer"
          onError={(e) => {
            if (!customLogoUrl) {
              e.currentTarget.src = CHUKA_CREST_FALLBACK;
            }
          }}
          className="w-full h-full object-contain filter drop-shadow-md rounded-2xl transition-transform duration-300"
        />

        {/* Quick swap button on hover */}
        <div
          className={`absolute bottom-3 right-3 flex items-center gap-1.5 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {customLogoUrl && (
            <button
              type="button"
              onClick={() => onLogoChange(null)}
              title="Reset to default logo"
              className="p-2 rounded-full bg-black/70 text-white hover:bg-black/90 text-xs backdrop-blur-sm border border-white/20 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload custom logo file"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/70 text-white hover:bg-black/90 text-xs backdrop-blur-sm border border-white/20 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#39ff14]" />
            <span>Change</span>
          </button>
        </div>

        {/* Drag over overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-[#0d120e]/90 backdrop-blur-sm flex flex-col items-center justify-center text-[#39ff14] font-semibold text-sm">
            <Upload className="w-8 h-8 mb-2 animate-bounce" />
            <span>Drop image to update logo</span>
          </div>
        )}
      </div>

      {/* Esports Badge Title underneath the logo */}
      <div className="mt-5 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#39ff14]/10 text-[#22c55e] border border-[#39ff14]/25 mb-1.5">
          <Sparkles className="w-3 h-3" />
          University Esports League • Est. 2024
        </div>
        <h1
          className={`text-2xl sm:text-3xl font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
          style={{ fontFamily: "'Chakra Petch', 'Plus Jakarta Sans', sans-serif" }}
        >
          CHUKA <span className="text-[#22c55e]">eFOOTBALL</span> LEAGUE
        </h1>
      </div>
    </div>
  );
};
