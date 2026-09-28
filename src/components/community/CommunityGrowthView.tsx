import React, { useEffect, useState } from 'react';
import { Gift, Link2, Trophy, Users, PlusCircle, Megaphone, CalendarClock, Copy, CheckCircle2 } from 'lucide-react';
import { createManagedLeague, getMyManagedLeagues, getReferralDashboard, claimReferralTicket, submitAdvertisement, getAdminAdvertisements, updateAdvertisementStatus, getPlatformSettings, setPlatformSetting } from '../../api/endpoints';
import { useAdmin } from '../../auth/AdminProvider';
import { ManagedLeague, ReferralDashboard } from '../../types';

export const CommunityGrowthView: React.FC = () => {
  const [referral, setReferral] = useState<ReferralDashboard | null>(null);
  const [leagues, setLeagues] = useState<ManagedLeague[]>([]);
  const [copied, setCopied] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [matchWindow, setMatchWindow] = useState('Saturday 2:00 PM – 6:00 PM');
  const [leagueEnd, setLeagueEnd] = useState('');
  const [leagueBusy, setLeagueBusy] = useState(false);
  const [adBusy, setAdBusy] = useState(false);
  const [message, setMessage] = useState('');
  const { isAdmin } = useAdmin();
  const [videoUrl, setVideoUrl] = useState('');
  const [adminAds, setAdminAds] = useState<any[]>([]);

  const load = async () => {
    const [r, l, settings] = await Promise.all([getReferralDashboard(), getMyManagedLeagues(), getPlatformSettings()]);
    if (r.success && r.data) setReferral(r.data.dashboard);
    if (l.success && l.data) setLeagues(l.data.leagues);
    if (settings.success && settings.data) setVideoUrl(settings.data.settings.HOME_YOUTUBE_URL || '');
    if (isAdmin) { const a = await getAdminAdvertisements(); if (a.success && a.data) setAdminAds(a.data.ads); }
  };
  useEffect(() => { load(); }, []);

  const copyReferral = async () => {
    if (!referral) return;
    await navigator.clipboard?.writeText(referral.referralLink);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  const createLeague = async (e: React.FormEvent) => {
    e.preventDefault(); setLeagueBusy(true); setMessage('');
    const r = await createManagedLeague({ name: leagueName, registrationEnd: leagueEnd, matchWindow });
    setLeagueBusy(false);
    if (r.success) { setMessage('League created. Share the league link with players.'); setLeagueName(''); await load(); }
    else setMessage(r.error?.message || 'Could not create league.');
  };

  const claim = async () => {
    const r = await claimReferralTicket();
    setMessage(r.success ? 'Free Knockout ticket claimed.' : (r.error?.message || 'Ticket claim failed.'));
    await load();
  };

  const advertise = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setAdBusy(true);
    const fd = new FormData(e.currentTarget);
    const r = await submitAdvertisement({
      businessName: String(fd.get('businessName') || ''), category: String(fd.get('category') || ''),
      description: String(fd.get('description') || ''), phone: String(fd.get('phone') || ''),
      whatsapp: String(fd.get('whatsapp') || ''), location: String(fd.get('location') || ''),
      websiteURL: String(fd.get('websiteURL') || ''), packageName: String(fd.get('packageName') || '7 Days'),
      amount: Number(fd.get('amount') || 300), paymentReference: String(fd.get('paymentReference') || ''),
    });
    setAdBusy(false); setMessage(r.success ? 'Advertisement submitted for payment/review.' : (r.error?.message || 'Advertisement submission failed.'));
    if (r.success) e.currentTarget.reset();
  };

  return <div className="space-y-6">
    <div className="grid lg:grid-cols-2 gap-5">
      <section className="rounded-3xl border border-[#22c55e]/30 bg-gradient-to-br from-[#12331d] to-[#0d140f] p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.22em] text-[#22c55e] font-black">Invite & Earn</p><h2 className="text-2xl font-black text-white mt-1">Build the CHUKA community</h2></div><Gift className="w-8 h-8 text-amber-300"/></div>
        <p className="text-sm text-gray-300 mt-3">Every verified referral counts toward your next free Knockout ticket. 10 verified referrals = 1 ticket; progress carries forward.</p>
        {referral && <><div className="grid grid-cols-3 gap-2 mt-5"><Stat label="Verified" value={referral.verifiedReferrals}/><Stat label="Tickets" value={referral.availableTickets}/><Stat label="Next" value={referral.nextTicketAt}/></div><div className="mt-5 flex gap-2"><input readOnly value={`${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(referral.referralCode)}`} className="flex-1 min-w-0 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs text-gray-200"/><button onClick={copyReferral} className="px-3 rounded-xl bg-[#22c55e] text-black font-bold text-xs">{copied ? <CheckCircle2 className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}</button></div><button disabled={referral.availableTickets <= 0} onClick={claim} className="mt-3 w-full py-2.5 rounded-xl bg-amber-400 disabled:opacity-40 text-black font-black text-xs uppercase">Claim Free Knockout Ticket</button></>}
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111712] p-6">
        <div className="flex items-center gap-3"><Trophy className="text-[#22c55e]"/><div><p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Self-service</p><h2 className="text-xl font-black text-white">Start Your League Today</h2></div></div>
        <form onSubmit={createLeague} className="mt-5 space-y-3">
          <input required value={leagueName} onChange={e=>setLeagueName(e.target.value)} placeholder="League name" className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white"/>
          <input value={matchWindow} onChange={e=>setMatchWindow(e.target.value)} placeholder="Match window e.g. Saturday 2–6 PM" className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white"/>
          <input type="datetime-local" value={leagueEnd} onChange={e=>setLeagueEnd(e.target.value)} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white"/>
          <button disabled={leagueBusy} className="w-full py-3 rounded-xl bg-[#22c55e] text-black font-black text-xs uppercase flex items-center justify-center gap-2"><PlusCircle className="w-4 h-4"/>{leagueBusy?'Creating…':'Create League & Get Share Link'}</button>
        </form>
        {leagues.length>0 && <div className="mt-5 space-y-2">{leagues.map(l=><div key={l.CompetitionID} className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-between"><div><div className="text-sm font-bold text-white">{l.Name}</div><div className="text-[10px] text-gray-400">{l.MatchWindow} · {l.RegisteredCount||0} players</div></div><button onClick={()=>navigator.clipboard?.writeText(`${location.origin}${location.pathname}?league=${l.CompetitionID}&ref=${l.ShareCode}`)} className="p-2 rounded-lg bg-[#22c55e]/15 text-[#22c55e]"><Link2 className="w-4 h-4"/></button></div>)}</div>}
      </section>
    </div>

    <section className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#211a0b] to-[#111712] p-6">
      <div className="flex items-center gap-3"><Megaphone className="text-amber-300"/><div><p className="text-[10px] uppercase tracking-[0.2em] text-amber-300">Business Promotion</p><h2 className="text-xl font-black text-white">Advertise your business on CHUKA eFootball</h2></div></div>
      <form onSubmit={advertise} className="grid md:grid-cols-2 gap-3 mt-5">
        {['businessName','category','phone','whatsapp','location','websiteURL','packageName','amount','paymentReference'].map((name)=><input key={name} name={name} required={['businessName','category','packageName','amount'].includes(name)} placeholder={name.replace(/[A-Z]/g,m=>' '+m).replace(/^./,m=>m.toUpperCase())} className="rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white"/>)}
        <textarea name="description" placeholder="Business description / offer" className="md:col-span-2 rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white min-h-24"/>
        <button disabled={adBusy} className="md:col-span-2 py-3 rounded-xl bg-amber-400 text-black font-black text-xs uppercase">{adBusy?'Submitting…':'Submit Advertisement'}</button>
      </form>
    </section>
    {isAdmin && <section className="rounded-3xl border border-purple-500/20 bg-[#130f1a] p-6 space-y-5">
      <div><p className="text-[10px] uppercase tracking-[0.2em] text-purple-300">Admin Commercial Manager</p><h2 className="text-xl font-black text-white">Homepage media & advertisements</h2></div>
      <div className="flex gap-2"><input value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="YouTube video URL" className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white"/><button onClick={async()=>{const r=await setPlatformSetting('HOME_YOUTUBE_URL',videoUrl);setMessage(r.success?'Homepage video updated.':(r.error?.message||'Update failed.'));}} className="px-4 rounded-xl bg-purple-400 text-black font-black text-xs">Save Video</button></div>
      <div className="space-y-2">{adminAds.map(ad=><div key={ad.AdID} className="rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><div className="font-bold text-white">{ad.BusinessName}</div><div className="text-[10px] text-gray-400">{ad.Package} · KSh {ad.Amount} · {ad.Status}</div></div><div className="flex gap-2"><button onClick={async()=>{await updateAdvertisementStatus(ad.AdID,'APPROVED',new Date().toISOString(),new Date(Date.now()+7*86400000).toISOString());await load();}} className="px-3 py-1.5 rounded-lg bg-[#22c55e] text-black text-[10px] font-black">Approve</button><button onClick={async()=>{await updateAdvertisementStatus(ad.AdID,'REJECTED');await load();}} className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-[10px] font-black">Reject</button><button onClick={async()=>{await updateAdvertisementStatus(ad.AdID,'PAUSED');await load();}} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black">Pause</button></div></div>)}</div>
    </section>}

    {message && <div className="rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 p-3 text-sm text-[#b7f7c7]">{message}</div>}
  </div>
};

const Stat: React.FC<{label:string;value:number}> = ({label,value}) => <div className="rounded-xl bg-black/25 border border-white/10 p-3 text-center"><div className="text-xl font-black text-white">{value}</div><div className="text-[9px] uppercase tracking-widest text-gray-500">{label}</div></div>;
