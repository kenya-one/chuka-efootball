import React, { useEffect, useMemo, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { getPlatformSettings } from '../../api/endpoints';

const toEmbed = (value: string) => {
  if (!value) return '';
  try {
    const u = new URL(value);
    const id = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop();
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0` : value;
  } catch { return value.includes('/embed/') ? value : ''; }
};

export const PlatformMediaBanner: React.FC = () => {
  const [video, setVideo] = useState('');
  const [title, setTitle] = useState('CHUKA eFootball Highlights');
  useEffect(() => { getPlatformSettings().then(r => { const x=r.data?.settings||{}; if(x.HOME_YOUTUBE_URL) setVideo(x.HOME_YOUTUBE_URL); if(x.HOME_VIDEO_TITLE) setTitle(x.HOME_VIDEO_TITLE); }).catch(()=>{}); }, []);
  const embed=useMemo(()=>toEmbed(video),[video]);
  if(!embed) return null;
  return <section className="rounded-[2rem] overflow-hidden border border-[#22c55e]/20 bg-[#0b120d] shadow-2xl">
    <div className="px-5 py-3 flex items-center justify-between border-b border-white/10"><div className="flex items-center gap-2"><PlayCircle className="w-4 h-4 text-[#22c55e]"/><span className="text-xs font-black uppercase tracking-widest text-white">{title}</span></div><span className="text-[9px] uppercase tracking-widest text-gray-500">Official Media</span></div>
    <div className="aspect-video bg-black"><iframe className="w-full h-full" src={embed} title={title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
  </section>;
};
