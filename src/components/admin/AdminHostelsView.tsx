import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  House,
  Image as ImageIcon,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { apiClient } from '../../api/client';

type Room = {
  roomId?: string;
  roomType?: string;
  monthlyRent?: number | string;
  availabilityStatus?: string;
  availableCount?: number;
};

type Photo = {
  photoId?: string;
  imageUrl?: string;
  caption?: string;
};

type Hostel = {
  hostelId: string;
  name?: string;
  location?: string;
  customLocation?: string;
  description?: string;
  status?: string;
  submittedByName?: string;
  submittedByEmail?: string;
  landlordName?: string;
  landlordPhone?: string;
  landlordWhatsapp?: string;
  caretakerName?: string;
  caretakerPhone?: string;
  caretakerWhatsapp?: string;
  rooms?: Room[];
  photos?: Photo[];
};

function driveFileId(value?: string) {
  const url = String(value || '').trim();
  if (!url) return '';
  const patterns = [
    /[?&]id=([A-Za-z0-9_-]{10,})/,
    /\/d\/([A-Za-z0-9_-]{10,})/,
    /googleusercontent\.com\/d\/([A-Za-z0-9_-]{10,})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return '';
}

function imageCandidates(value?: string) {
  const url = String(value || '').trim();
  if (!url) return [];
  const id = driveFileId(url);
  const candidates = [url];
  if (id) {
    candidates.push(
      `https://drive.google.com/thumbnail?id=${id}&sz=w1200`,
      `https://lh3.googleusercontent.com/d/${id}=w1200`,
      `https://drive.google.com/uc?export=view&id=${id}`,
    );
  }
  return [...new Set(candidates)];
}

function imageUrl(value?: string) {
  return imageCandidates(value)[0] || '';
}

const DriveImage: React.FC<{
  src?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}> = ({ src, alt, className = '', loading = 'lazy' }) => {
  const sources = imageCandidates(src);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [src]);

  if (!sources.length || index >= sources.length) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-black/30 text-gray-500 ${className}`}>
        <ImageIcon className="h-7 w-7" />
      </div>
    );
  }

  return (
    <img
      src={sources[index]}
      alt={alt}
      className={className}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setIndex(current => current + 1)}
    />
  );
};

function contactFor(hostel: Hostel) {
  return hostel.landlordWhatsapp ||
    hostel.landlordPhone ||
    hostel.caretakerWhatsapp ||
    hostel.caretakerPhone ||
    '';
}

function availabilityTone(status?: string) {
  const s = String(status || '').toUpperCase();
  if (s === 'AVAILABLE') return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';
  if (s === 'LIMITED') return 'text-amber-300 bg-amber-500/10 border-amber-500/20';
  return 'text-rose-300 bg-rose-500/10 border-rose-500/20';
}

export const AdminHostelsView: React.FC = () => {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Hostel | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await apiClient.post<any>(
        {},
        { action: 'adminGetHostels' },
        { authenticated: true }
      );
      if (r.success) {
        setHostels(
          r.data?.hostels ||
          r.data?.data?.hostels ||
          r.data?.hostelsList ||
          []
        );
      } else {
        setError(r.error?.message || 'Could not load hostel submissions.');
      }
    } catch (e: any) {
      setError(e?.message || 'Could not load hostel submissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = async (hostel: Hostel, approve: boolean) => {
    setBusyId(hostel.hostelId);
    setNotice('');
    setError('');
    try {
      const r = await apiClient.post(
        { hostelId: hostel.hostelId },
        {
          action: approve ? 'adminApproveHostel' : 'adminRejectHostel',
        },
        { authenticated: true }
      );

      if (r.success) {
        setNotice(
          `${hostel.name || 'Hostel'} ${approve ? 'approved' : 'rejected'}.`
        );
        if (selected?.hostelId === hostel.hostelId) setSelected(null);
        await load();
      } else {
        setError(
          r.error?.message ||
          `Could not ${approve ? 'approve' : 'reject'} this hostel.`
        );
      }
    } catch (e: any) {
      setError(e?.message || 'Moderation request failed.');
    } finally {
      setBusyId('');
    }
  };

  const updateAvailability = async (
    hostel: Hostel,
    room: Room,
    status: 'AVAILABLE' | 'LIMITED' | 'FULL'
  ) => {
    if (!room.roomId) return;
    setBusyId(`${hostel.hostelId}:${room.roomId}`);
    setError('');
    setNotice('');
    try {
      const r = await apiClient.post(
        {
          hostelId: hostel.hostelId,
          roomId: room.roomId,
          availabilityStatus: status,
          availableCount:
            status === 'FULL' ? 0 : Number(room.availableCount || 1),
          note: 'Updated from Chuka Arena Admin',
        },
        { action: 'updateHostelAvailability' },
        { authenticated: true }
      );

      if (r.success) {
        setNotice(
          `${hostel.name || 'Hostel'} — ${room.roomType || 'Room'} marked ${status.toLowerCase()}.`
        );
        await load();
        if (selected?.hostelId === hostel.hostelId) {
          const refreshed = hostels.find(h => h.hostelId === hostel.hostelId);
          if (refreshed) setSelected(refreshed);
        }
      } else {
        setError(r.error?.message || 'Could not update room availability.');
      }
    } catch (e: any) {
      setError(e?.message || 'Availability update failed.');
    } finally {
      setBusyId('');
    }
  };

  const pending = hostels.filter(
    h => String(h.status || 'PENDING').toUpperCase() === 'PENDING'
  );
  const reviewed = hostels.filter(
    h => String(h.status || '').toUpperCase() !== 'PENDING'
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <House className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-black text-white uppercase tracking-wider">
              Hostel Moderation
            </h3>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Review hostel submissions before they become public, inspect photos,
            and update room availability.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200 flex gap-2 items-start">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200 flex gap-2 items-start">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />
          Loading hostel submissions…
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                Pending approval
              </h4>
              <span className="text-xs text-amber-300">{pending.length} pending</span>
            </div>

            {pending.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-gray-400">
                No pending hostel submissions.
              </div>
            ) : (
              <div className="grid gap-3">
                {pending.map(hostel => (
                  <HostelModerationCard
                    key={hostel.hostelId}
                    hostel={hostel}
                    busy={busyId === hostel.hostelId}
                    onOpen={() => setSelected(hostel)}
                    onApprove={() => moderate(hostel, true)}
                    onReject={() => moderate(hostel, false)}
                    onAvailability={updateAvailability}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                Reviewed hostels
              </h4>
              <span className="text-xs text-gray-400">{reviewed.length} listings</span>
            </div>
            <div className="grid gap-3">
              {reviewed.map(hostel => (
                <HostelModerationCard
                  key={hostel.hostelId}
                  hostel={hostel}
                  busy={busyId === hostel.hostelId}
                  onOpen={() => setSelected(hostel)}
                  onApprove={() => moderate(hostel, true)}
                  onReject={() => moderate(hostel, false)}
                  onAvailability={updateAvailability}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {selected && (
        <HostelPreview
          hostel={selected}
          onClose={() => setSelected(null)}
          onAvailability={updateAvailability}
        />
      )}
    </div>
  );
};

function HostelModerationCard({
  hostel,
  busy,
  onOpen,
  onApprove,
  onReject,
  onAvailability,
}: {
  hostel: Hostel;
  busy: boolean;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
  onAvailability: (
    hostel: Hostel,
    room: Room,
    status: 'AVAILABLE' | 'LIMITED' | 'FULL'
  ) => void;
}) {
  const photos = Array.isArray(hostel.photos) ? hostel.photos : [];
  const firstImage = imageUrl(photos[0]?.imageUrl);
  const status = String(hostel.status || 'PENDING').toUpperCase();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <button
          type="button"
          onClick={onOpen}
          className="w-full lg:w-44 h-32 rounded-xl overflow-hidden bg-black/30 border border-white/10 relative shrink-0"
          title="View hostel images and details"
        >
          {firstImage ? (
            <DriveImage
              src={firstImage}
              alt={`${hostel.name || 'Hostel'} preview`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <ImageIcon className="w-7 h-7" />
            </div>
          )}
          {photos.length > 0 && (
            <span className="absolute bottom-2 left-2 rounded-lg bg-black/70 px-2 py-1 text-[11px] text-white">
              {photos.length} image{photos.length === 1 ? '' : 's'} · View
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h5 className="font-black text-white text-base">{hostel.name || 'Unnamed hostel'}</h5>
              <p className="text-xs text-gray-400 mt-1">
                {hostel.location || hostel.customLocation || 'Location not listed'}
                {hostel.submittedByName ? ` · submitted by ${hostel.submittedByName}` : ''}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-lg border text-[10px] font-black uppercase ${status === 'APPROVED' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : status === 'REJECTED' ? 'text-rose-300 bg-rose-500/10 border-rose-500/20' : 'text-amber-300 bg-amber-500/10 border-amber-500/20'}`}>
              {status}
            </span>
          </div>

          {hostel.description && (
            <p className="text-sm text-gray-300 mt-2 line-clamp-2">{hostel.description}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {(hostel.rooms || []).map(room => (
              <div key={room.roomId || room.roomType} className="rounded-xl border border-white/10 bg-black/20 px-2.5 py-2 min-w-[150px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">{room.roomType || 'Room'}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase ${availabilityTone(room.availabilityStatus)}`}>
                    {room.availabilityStatus || 'FULL'}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {room.monthlyRent ? `KSh ${Number(room.monthlyRent).toLocaleString()} / month` : 'Rent not listed'}
                </div>
                <div className="flex gap-1 mt-2">
                  {(['AVAILABLE', 'LIMITED', 'FULL'] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      disabled={busy}
                      onClick={() => onAvailability(hostel, room, option)}
                      className={`px-2 py-1 rounded-md text-[9px] font-black border ${
                        String(room.availabilityStatus || '').toUpperCase() === option
                          ? 'bg-white/10 text-white border-white/20'
                          : 'text-gray-500 border-white/5 hover:text-white hover:bg-white/5'
                      } disabled:opacity-50`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={onOpen} className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10">
              <ImageIcon className="w-4 h-4 inline mr-1.5" />
              View images & details
            </button>

            {contactFor(hostel) && (
              <a
                href={`https://wa.me/${String(contactFor(hostel)).replace(/\D/g, '').replace(/^0/, '254')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-sm text-emerald-200 hover:bg-emerald-500/20"
              >
                WhatsApp contact
              </a>
            )}

            {status === 'PENDING' && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onApprove}
                  className="px-3 py-2 rounded-xl bg-emerald-500 text-black text-sm font-black hover:bg-emerald-400 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 inline mr-1.5" />
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onReject}
                  className="px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm font-black hover:bg-rose-500/20 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 inline mr-1.5" />
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HostelPreview({
  hostel,
  onClose,
  onAvailability,
}: {
  hostel: Hostel;
  onClose: () => void;
  onAvailability: (
    hostel: Hostel,
    room: Room,
    status: 'AVAILABLE' | 'LIMITED' | 'FULL'
  ) => void;
}) {
  const photos = Array.isArray(hostel.photos) ? hostel.photos : [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [hostel.hostelId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 p-4 flex items-center justify-center">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-auto rounded-3xl border border-white/10 bg-[#0b0f0d] p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h4 className="text-xl font-black text-white">{hostel.name || 'Hostel'}</h4>
            <p className="text-sm text-gray-400 mt-1">
              {hostel.location || hostel.customLocation || 'Location not listed'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5"
          >
            Close
          </button>
        </div>

        {photos.length > 0 ? (
          <div className="space-y-2">
            <div className="h-80 rounded-2xl overflow-hidden bg-black/30 border border-white/10">
              <DriveImage
                src={photos[index]?.imageUrl}
                alt={photos[index]?.caption || `${hostel.name || 'Hostel'} image ${index + 1}`}
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {photos.map((photo, i) => (
                  <button
                    type="button"
                    key={photo.photoId || i}
                    onClick={() => setIndex(i)}
                    className={`w-20 h-16 rounded-lg overflow-hidden border ${i === index ? 'border-emerald-400' : 'border-white/10'}`}
                  >
                    <DriveImage
                      src={photo.imageUrl}
                      alt={photo.caption || ''}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-48 rounded-2xl border border-white/10 flex items-center justify-center text-gray-500">
            No hostel images were uploaded.
          </div>
        )}

        {hostel.description && (
          <p className="text-sm text-gray-300 mt-4 whitespace-pre-wrap">{hostel.description}</p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
          {(hostel.rooms || []).map(room => (
            <div key={room.roomId || room.roomType} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-2">
                <b className="text-white">{room.roomType || 'Room'}</b>
                <span className={`text-[10px] px-2 py-1 rounded border uppercase ${availabilityTone(room.availabilityStatus)}`}>
                  {room.availabilityStatus || 'FULL'}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {room.monthlyRent ? `KSh ${Number(room.monthlyRent).toLocaleString()} / month` : 'Rent not listed'}
              </p>
              <div className="flex gap-1 mt-3">
                {(['AVAILABLE', 'LIMITED', 'FULL'] as const).map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onAvailability(hostel, room, option)}
                    className="px-2 py-1 rounded-md text-[9px] font-black border border-white/10 text-gray-300 hover:bg-white/5"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-300">
          <b className="text-white">Contact</b>
          <div className="mt-1">
            {hostel.caretakerName || hostel.landlordName || 'Landlord/caretaker'} · {contactFor(hostel) || 'No phone listed'}
          </div>
        </div>
      </div>
    </div>
  );
}
