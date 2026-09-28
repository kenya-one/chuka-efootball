import React, { useEffect, useRef, useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Send } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  label?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Uses the native share sheet when available (phones), otherwise shows a
 * small menu with WhatsApp, Telegram and copy-link.
 */
export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url,
  label = 'Share',
  compact = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const fullMessage = `${text} ${url}`.trim();

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, text, url });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    setOpen((o) => !o);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullMessage);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = fullMessage;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        title="Share"
        className={`inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-gray-200 font-semibold transition-all cursor-pointer ${
          compact ? 'p-2' : 'px-3 py-2 text-xs'
        }`}
      >
        <Share2 className="w-3.5 h-3.5 text-[#22c55e]" />
        {!compact && <span>{label}</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 z-50 rounded-2xl border border-white/10 bg-[#0d140f] shadow-2xl p-1.5 text-xs">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(fullMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-gray-200"
            onClick={() => setOpen(false)}
          >
            <MessageCircle className="w-4 h-4 text-[#22c55e]" /> WhatsApp
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-gray-200"
            onClick={() => setOpen(false)}
          >
            <Send className="w-4 h-4 text-sky-400" /> Telegram
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-gray-200 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#22c55e]" /> : <Copy className="w-4 h-4 text-amber-400" />}
            {copied ? 'Copied!' : 'Copy message & link'}
          </button>
        </div>
      )}
    </div>
  );
};
