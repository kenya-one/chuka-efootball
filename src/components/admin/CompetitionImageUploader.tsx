import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface CompetitionImageUploaderProps {
  currentImageUrl?: string;
  onImageSelected: (base64Data: string, mimeType: string, fileName: string) => void;
  onImageRemoved: () => void;
  competitionType?: 'KNOCKOUT' | 'LEAGUE' | string;
  disabled?: boolean;
}

export const CompetitionImageUploader: React.FC<CompetitionImageUploaderProps> = ({
  currentImageUrl,
  onImageSelected,
  onImageRemoved,
  competitionType = 'KNOCKOUT',
  disabled = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync prop changes
  React.useEffect(() => {
    setPreviewUrl(currentImageUrl || null);
  }, [currentImageUrl]);

  const handleFileChange = (file: File) => {
    setError(null);

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please choose a JPEG, PNG, or WebP image file.');
      return;
    }

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setError('Image size exceeds 8MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setPreviewUrl(dataUrl);
        onImageSelected(dataUrl, file.type, file.name);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemoved();
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
        {competitionType === 'KNOCKOUT' ? 'Tournament Profile Picture' : 'League Profile Picture'}
        <span className="text-gray-500 font-normal lowercase ml-1.5">(Required • JPEG/PNG/WebP, max 8MB)</span>
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden ${
          isDragging
            ? 'border-[#22c55e] bg-[#22c55e]/10'
            : previewUrl
            ? 'border-[#22c55e]/40 bg-black/40 hover:border-[#22c55e]'
            : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />

        {previewUrl ? (
          <div className="w-full flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-white/20 shrink-0 bg-black/60 shadow-lg">
              <img
                src={previewUrl}
                alt="Competition Profile Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 text-[#22c55e]">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex-1 text-left space-y-1">
              <span className="text-[11px] font-bold text-[#22c55e] uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Profile Picture Selected
              </span>
              <p className="text-xs text-gray-300">
                Uploaded picture will be securely stored in Google Drive and displayed on cards, fixtures, and brackets.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={disabled}
                  className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace Image</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="px-3 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1 border border-red-500/30 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-5 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mx-auto text-gray-400 group-hover:text-white transition-colors">
              <UploadCloud className="w-6 h-6 text-[#22c55e]" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Click to upload or drag & drop competition picture
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                PNG, JPG or WebP (Official tournament branding recommended)
              </p>
            </div>
            <div className="pt-1">
              <span className="inline-block px-3 py-1 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-[10px] font-bold uppercase tracking-wider">
                Drive Cloud Storage
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
