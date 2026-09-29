import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, House, Image as ImageIcon, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { apiClient } from '../../api/client';

type Hostel = {
  hostelId: string;
  name?: string;
  location?: string;
  customLocation?: string;
  description?: string;
  status?: string;
  rooms?: Array<{ roomId?: string; roomType?: string; monthlyRent?: number | string; availabilityStatus?: string; availableCount?: number }>;
  photos?: Array<{ photoId?: string; imageUrl?: string; caption?: string }>;
};

function imageUrl(value?: string) {
  const url = String(value || '').trim();
  if (!url) return '';
  const match = url.match(/(?:id=|\/d\/)([A-Za-z0-9_-]{20,})/);
  return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800` : url;
}

export const AdminHostelsView: React.FC = () => {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await apiClient.post<any>({}, { action: 'adminGetHostels' }, { authenticated: true });
      if (r.success) setHostels(r.data?.hostels || r.data?.data?.hostels || r.data?.hostelsList || []);
      else setError(r.error?.message || 'Could not load hostel submissions.');
    } catch (e: any) { setError(e?.message || 'Could not load hostel submissions.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const moderate = async (hostel: Hostel, approve: boolean) => {
    setBusyId(hostel.hostelId); setNotice(''); setError('');
    try {
      const r = await apiClient.post({ hostelId: hostel.hostelId }, { action: approve ? 'adminApproveHostel' : 'adminRejectHostel' }, { authenticated: true });
      if (r.success) {
        setNotice(`${hostel.name || 'Hostel'} ${approve ? 'approved' : 'rejected'}.`);
        await load();
      } else setError(r.error?.message || `Could not ${approve ? 'approve' : 'reject'} this hostel.`);
    } catch (e: any) { setError(e?.message || 'Moderation request failed.'); }
    finally { setBusyId(''); }
  };

  const pending = hostels.filter(h => String(h.status || '').toUpperCase() === 'PENDING');
  const reviewed = hostels.filter(h => String(h.status || '').toUpperCase() !== 'PENDING');
  const renderHostel = (hostel: Hostel) => {
    const photo = imageUrl(hostel.photos?.[0]?.imageUrl);
    return <article key={hostel.hostelId} className="rounded-2xl border border-white/10 bg-white/[0.035] overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        <div className="w-full sm:w-40 h-32 rounded-xl bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
          {photo ? <img src={photo} alt={`${hostel.name || 'Hostel'} photo`} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={e => { e.currentTarget.style.display = 'none'; }} /> : <ImageIcon className="text-gray-500" size={28} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-bold text-white">{hostel.name || 'Unnamed hostel'}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${String(hostel.status).toUpperCase()==='APPROVED'?'bg-emerald-500/15 text-emerald-300':'bg-amber-500/15 text-amber-300'}`}>{hostel.status || 'PENDING'}</span></div>
          <p className="text-sm text-gray-400 mt-1">{hostel.location === 'Custom' ? hostel.customLocation : hostel.location || 'Location not specified'}</p>
          {hostel.description && <p className="text-sm text-gray-300 mt-2 line-clamp-3">{hostel.description}</p>}
          <div className="flex flex-wrap gap-2 mt-3">{(hostel.rooms || []).map((room, i) => <span key={room.roomId || i} className="text-xs rounded-lg border border-white/10 px-2 py-1 text-gray-300">{room.roomType || 'Room'} · KSh {room.monthlyRent || '—'} · {room.availabilityStatus || '—'}{room.availableCount != null ? ` (${room.availableCount})` : ''}</span>)}</div>
          {hostel.photos?.length ? <p className="text-xs text-gray-500 mt-2">{hostel.photos.length} photo(s) attached</p> : <p className="text-xs text-amber-300/80 mt-2">No photos attached</p>}
        </div>
        {String(hostel.status || '').toUpperCase() === 'PENDING' && <div className="flex sm:flex-col gap-2 sm:min-w-28">
          <button type="button" disabled={!!busyId} onClick={() => void moderate(hostel, true)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-50">{busyId === hostel.hostelId ? <RefreshCw size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>} Approve</button>
          <button type="button" disabled={!!busyId} onClick={() => void moderate(hostel, false)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-50"><XCircle size={14}/> Reject</button>
        </div>}
      </div>
    </article>;
  };

  return <section className="space-y-5 text-white">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-emerald-300"><ShieldCheck size={18}/><span className="text-xs font-bold uppercase tracking-widest">Hostel moderation</span></div><h2 className="text-2xl font-black mt-1">Hostel approvals</h2><p className="text-sm text-gray-400 mt-1">Review submitted listings and approve them for the public Hostel Finder.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/5 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Refresh</button></div>
    {notice && <div role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</div>}
    {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200"><AlertCircle size={16}/>{error}</div>}
    {loading ? <div className="flex items-center gap-2 py-8 text-sm text-gray-400"><RefreshCw size={16} className="animate-spin"/> Loading hostel submissions…</div> : <>
      <div className="flex flex-wrap gap-2"><span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300">Pending: {pending.length}</span><span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">Approved: {hostels.filter(h => String(h.status).toUpperCase()==='APPROVED').length}</span></div>
      <div className="space-y-3"><h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">Needs review</h3>{pending.length ? pending.map(renderHostel) : <p className="rounded-xl border border-white/10 p-4 text-sm text-gray-400">No pending hostel submissions.</p>}</div>
      <div className="space-y-3"><h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">Previously reviewed</h3>{reviewed.length ? reviewed.map(renderHostel) : <p className="rounded-xl border border-white/10 p-4 text-sm text-gray-400">No reviewed listings yet.</p>}</div>
    </>}
  </section>;
};
