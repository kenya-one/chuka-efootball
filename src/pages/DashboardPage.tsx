import React, { useEffect, useMemo, useState } from 'react';
import {
  Home, Gamepad2, House, Users, UserRound, Shield, LogOut, Plus, Search, MapPin,
  Wifi, Droplets, Zap, MessageCircle, Heart, Flag, CheckCircle2, Clock3, AlertTriangle,
  Menu, X, ChevronRight, BedDouble, HandHelping, Megaphone, Sparkles, Upload, Phone,
  ExternalLink, RefreshCw, SlidersHorizontal, LockKeyhole, EyeOff
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useAdmin } from '../auth/AdminProvider';
import { KnockoutView } from '../components/knockout/KnockoutView';
import { LeagueView } from '../components/league/LeagueView';
import { CompetitionList } from '../components/competitions/CompetitionList';
import { MyRegistrationsView } from '../components/competitions/MyRegistrationsView';
import { ProfileView } from '../components/profile/ProfileView';
import { AdminMasterHub } from '../components/admin/AdminMasterHub';
import { OfficialBrandBanner } from '../components/common/OfficialBrandBanner';
import { CHUKA_CREST_URL, CHUKA_CREST_FALLBACK } from '../components/common/ChukaOfficialCrest';
import { apiClient } from '../api/client';

export type DashboardTab = 'home' | 'efootball' | 'hostels' | 'community' | 'profile' | 'admin';

type Hostel = any;
type CommunityRequest = any;
type RoommatePost = any;
type HookupPost = any;

const locations = ['All', 'Mungoni', 'Marine', 'Slaughter', 'Ndagani', 'Lowlands', 'Juveras', 'Custom'];
const roomTypes = ['Single Room', 'Bedsitter', 'One Bedroom'];

function money(value: any) {
  if (value === '' || value === null || value === undefined) return 'Price on request';
  const n = Number(value);
  return Number.isFinite(n) ? `KSh ${n.toLocaleString()}` : String(value);
}

function whatsappUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`arena-card ${className}`}>{children}</section>;
}

function Pill({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default'|'green'|'amber'|'red'|'blue'|'purple' }) {
  return <span className={`arena-pill arena-pill-${tone}`}>{children}</span>;
}

function EmptyState({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return <div className="arena-empty"><Icon size={26} /><strong>{title}</strong><span>{text}</span></div>;
}

function Stat({ value, label, icon: Icon }: { value: string|number; label: string; icon: any }) {
  return <div className="arena-stat"><div className="arena-stat-icon"><Icon size={17}/></div><div><b>{value}</b><span>{label}</span></div></div>;
}

function HomeView({ onNavigate }: { onNavigate: (tab: DashboardTab) => void }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await apiClient.get<any>({ action: 'getAnnouncements' });
      if (alive && r.success) setAnnouncements(r.data?.announcements || []);
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return <div className="arena-page">
    <div className="arena-hero">
      <div className="arena-hero-copy">
        <Pill tone="green"><Sparkles size={13}/> CHUKA STUDENT HUB</Pill>
        <h1>Everything happening around <span>Chuka.</span></h1>
        <p>Find places to live, meet people, get help, follow eFootball and discover verified campus updates — all in one place.</p>
        <div className="arena-hero-actions">
          <button className="arena-btn arena-btn-primary" onClick={() => onNavigate('hostels')}><House size={17}/> Find a hostel</button>
          <button className="arena-btn arena-btn-ghost" onClick={() => onNavigate('community')}><Users size={17}/> Open community</button>
        </div>
      </div>
      <div className="arena-hero-orbit"><div className="orbit-core"><img src={CHUKA_CREST_URL} onError={(e)=>{e.currentTarget.src=CHUKA_CREST_FALLBACK}} alt="Chuka"/></div><span>ARENA</span></div>
    </div>

    <div className="arena-stats-grid">
      <Stat value="eFootball" label="Competitions" icon={Gamepad2}/>
      <Stat value="Hostels" label="Verified listings" icon={House}/>
      <Stat value="Community" label="Help & connections" icon={Users}/>
      <Stat value="WhatsApp" label="Primary contact" icon={MessageCircle}/>
    </div>

    <div className="arena-section-heading"><div><span>DISCOVER</span><h2>Campus board</h2></div><button className="arena-text-btn" onClick={() => onNavigate('community')}>View community <ChevronRight size={15}/></button></div>
    <div className="arena-feature-grid">
      <Card className="feature-card feature-green"><div className="feature-icon"><House/></div><div><span className="eyebrow">ACCOMMODATION</span><h3>Find where you fit</h3><p>Browse hostel locations, room types, estimated distance and live availability.</p><button onClick={() => onNavigate('hostels')}>Explore Hostels <ChevronRight size={15}/></button></div></Card>
      <Card className="feature-card feature-blue"><div className="feature-icon"><HandHelping/></div><div><span className="eyebrow">COMMUNITY HELP</span><h3>Someone needs a hand</h3><p>Post a request, accept one and move the conversation to WhatsApp.</p><button onClick={() => onNavigate('community')}>Open Help Feed <ChevronRight size={15}/></button></div></Card>
      <Card className="feature-card feature-purple"><div className="feature-icon"><Gamepad2/></div><div><span className="eyebrow">ESPORTS</span><h3>Play. Compete. Rise.</h3><p>Weekly cups, leagues, fixtures, results and your player profile stay here.</p><button onClick={() => onNavigate('efootball')}>Enter eFootball <ChevronRight size={15}/></button></div></Card>
    </div>

    <div className="arena-section-heading"><div><span>OFFICIAL UPDATES</span><h2>Campus announcements</h2></div></div>
    <Card>
      {loading ? <div className="arena-loading"><RefreshCw className="spin" size={18}/> Loading updates…</div> : announcements.length ? <div className="announcement-list">{announcements.slice(0,6).map((a,i)=><div className="announcement-row" key={a.id || a.AnnouncementID || i}><div className="announcement-icon"><Megaphone size={17}/></div><div><b>{a.title || a.Title || a.subject || 'Campus update'}</b><p>{a.message || a.Message || a.description || ''}</p></div></div>)}</div> : <EmptyState icon={Megaphone} title="No announcements yet" text="New verified campus updates will appear here."/>}
    </Card>

    <Card className="trust-strip"><Shield size={20}/><div><b>Verified-first community</b><span>Hostel listings require approval. Anonymous social posts keep real identity private from the public feed. Report anything that breaks the rules.</span></div></Card>
  </div>;
}

function HostelView() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [location, setLocation] = useState('All');
  const [roomType, setRoomType] = useState('All');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Hostel|null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true); const r = await apiClient.post<any>({ location: location === 'All' ? '' : location }, { action: 'getHostels' });
    if (r.success) setHostels(r.data?.hostels || []); else setMessage(r.error?.message || 'Could not load hostels.');
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => hostels.filter(h => {
    const text = `${h.name||''} ${h.location||''} ${h.description||''}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (location === 'All' || h.location === location) && (roomType === 'All' || (h.rooms||[]).some((r:any)=>r.roomType===roomType));
  }), [hostels, location, roomType, query]);

  return <div className="arena-page">
    <div className="arena-page-title"><div><Pill tone="green"><House size={13}/> HOSTEL FINDER</Pill><h1>Find your next place.</h1><p>Verified listings around Chuka, with room types, rent and live availability.</p></div><button className="arena-btn arena-btn-primary" onClick={()=>setShowForm(true)}><Plus size={17}/> Submit hostel</button></div>
    <Card className="filter-bar"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search hostel or area…"/></div><select value={location} onChange={e=>setLocation(e.target.value)}>{locations.map(x=><option key={x}>{x}</option>)}</select><select value={roomType} onChange={e=>setRoomType(e.target.value)}><option>All</option>{roomTypes.map(x=><option key={x}>{x}</option>)}</select><button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={17}/></button></Card>
    {message && <div className="arena-notice"><AlertTriangle size={16}/>{message}</div>}
    {loading ? <div className="arena-loading"><RefreshCw className="spin" size={18}/> Loading verified hostels…</div> : filtered.length ? <div className="hostel-grid">{filtered.map(h=><HostelCard key={h.hostelId} hostel={h} onOpen={()=>setSelected(h)}/>)}</div> : <EmptyState icon={House} title="No hostels found" text="Try another location or submit a new hostel listing."/>}
    {showForm && <HostelForm onClose={()=>setShowForm(false)} onSaved={()=>{setShowForm(false);load()}}/>}
    {selected && <HostelDetail hostel={selected} onClose={()=>setSelected(null)} onUpdated={load}/>} 
  </div>;
}

function HostelCard({ hostel, onOpen }: { hostel: Hostel; onOpen: ()=>void }) {
  const rooms = hostel.rooms || [];
  const minRent = rooms.map((r:any)=>Number(r.monthlyRent)).filter(Number.isFinite).sort((a,b)=>a-b)[0];
  const statuses = rooms.map((r:any)=>String(r.availabilityStatus||'FULL').toUpperCase());
  const status = statuses.includes('AVAILABLE') ? 'AVAILABLE' : statuses.includes('LIMITED') ? 'LIMITED' : 'FULL';
  return <Card className="hostel-card"><div className="hostel-photo-placeholder"><House size={32}/><span>{hostel.location}</span></div><div className="hostel-card-body"><div className="card-top"><div><h3>{hostel.name}</h3><span className="muted"><MapPin size={13}/> {hostel.location} · {hostel.estimatedDistance || '—'} {hostel.distanceUnit || 'km'}</span></div><Pill tone={status==='AVAILABLE'?'green':status==='LIMITED'?'amber':'red'}>{status}</Pill></div><div className="room-chip-row">{rooms.slice(0,3).map((r:any)=><span key={r.roomId||r.roomType}><BedDouble size={13}/>{r.roomType} · {money(r.monthlyRent)}</span>)}</div><div className="amenity-row">{hostel.wifiAvailable && <span><Wifi size={14}/> Wi‑Fi</span>}<span><Droplets size={14}/> Water</span><span><Zap size={14}/> Power</span></div><button className="arena-btn arena-btn-soft full" onClick={onOpen}>View details <ChevronRight size={15}/></button></div></Card>;
}

function HostelDetail({ hostel, onClose, onUpdated }: { hostel: Hostel; onClose:()=>void; onUpdated:()=>void }) {
  const [room, setRoom] = useState<any>((hostel.rooms||[])[0]);
  const [saving, setSaving] = useState(false);
  const update = async (status:string) => { if(!room) return; setSaving(true); const r=await apiClient.post({hostelId:hostel.hostelId,roomId:room.roomId,availabilityStatus:status,availableCount:status==='FULL'?0:Number(room.availableCount||0),note:'Updated from Chuka Arena'}, {action:'updateHostelAvailability'}, {authenticated:true}); setSaving(false); if(r.success){setRoom({...room,availabilityStatus:status});onUpdated();} };
  return <div className="arena-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="arena-modal large"><button className="modal-close" onClick={onClose}><X/></button><div className="modal-header"><div><Pill tone="green"><CheckCircle2 size={13}/> APPROVED LISTING</Pill><h2>{hostel.name}</h2><p><MapPin size={14}/> {hostel.location} · approx. {hostel.estimatedDistance || '—'} {hostel.distanceUnit || 'km'}</p></div></div><div className="detail-grid"><div><h4>Rooms & live availability</h4>{(hostel.rooms||[]).map((r:any)=><button key={r.roomId} onClick={()=>setRoom(r)} className={`room-detail ${room?.roomId===r.roomId?'selected':''}`}><span><b>{r.roomType}</b><small>{money(r.monthlyRent)} / month</small></span><Pill tone={String(r.availabilityStatus).toUpperCase()==='AVAILABLE'?'green':String(r.availabilityStatus).toUpperCase()==='LIMITED'?'amber':'red'}>{r.availabilityStatus || 'FULL'} {r.availableCount ? `· ${r.availableCount}`:''}</Pill></button>)}{room && <div className="availability-actions"><span>Update availability</span><div><button disabled={saving} onClick={()=>update('AVAILABLE')}>Available</button><button disabled={saving} onClick={()=>update('LIMITED')}>Limited</button><button disabled={saving} onClick={()=>update('FULL')}>Full</button></div></div>}</div><div><h4>Hostel details</h4><div className="detail-list"><div><Wifi/><span>Wi‑Fi<b>{hostel.wifiAvailable ? 'Available':'Not listed'}</b></span></div><div><Droplets/><span>Water<b>{hostel.waterPayment || 'Not listed'}</b></span></div><div><Zap/><span>Electricity<b>{hostel.electricityPayment || 'Not listed'}</b></span></div><div><Phone/><span>Care contact<b>{hostel.caretakerName || hostel.landlordName || 'Provided privately'}</b></span></div></div>{hostel.description && <p className="detail-description">{hostel.description}</p>}</div></div><div className="modal-footer-note"><Clock3 size={14}/> Availability is community-updated and should be confirmed before paying or moving in.</div></div></div>;
}

function HostelForm({ onClose, onSaved }: { onClose:()=>void; onSaved:()=>void }) {
  const [form,setForm]=useState<any>({name:'',location:'Ndagani',customLocation:'',estimatedDistance:'',distanceUnit:'km',description:'',landlordName:'',landlordPhone:'',landlordWhatsapp:'',caretakerName:'',caretakerPhone:'',caretakerWhatsapp:'',wifiAvailable:false,waterPayment:'',electricityPayment:'',rooms:roomTypes.map(roomType=>({roomType,monthlyRent:'',availabilityStatus:'AVAILABLE',availableCount:1}))});
  const [photos,setPhotos]=useState<File[]>([]);
  const [busy,setBusy]=useState(false); const [msg,setMsg]=useState('');
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setMsg('');const r=await apiClient.post(form,{action:'createHostel'}, {authenticated:true});if(!r.success){setBusy(false);setMsg(r.error?.message||'Submission failed.');return;}
    const hostelId=r.data?.hostelId;
    if(hostelId&&photos.length){
      for(const file of photos.slice(0,4)){
        const data=await new Promise<string>((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(String(fr.result||''));fr.onerror=reject;fr.readAsDataURL(file);});
        const up=await apiClient.post({hostelId,fileName:file.name,mimeType:file.type,fileData:data,photoType:'INTERIOR'}, {action:'uploadHostelPhoto'}, {authenticated:true});
        if(!up.success){setMsg(`Hostel saved, but ${file.name} could not be uploaded.`);setBusy(false);return;}
      }
    }
    setBusy(false);onSaved();
  };
  return <div className="arena-modal-backdrop"><div className="arena-modal large"><button className="modal-close" onClick={onClose}><X/></button><div className="modal-header"><Pill tone="green"><House size={13}/> NEW HOSTEL</Pill><h2>Submit a hostel</h2><p>Your listing starts as <b>PENDING</b> and becomes public only after admin verification.</p></div><form onSubmit={submit} className="form-grid"><label className="span-2">Hostel name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Location<select value={form.location} onChange={e=>setForm({...form,location:e.target.value})}>{locations.slice(1).map(x=><option key={x}>{x}</option>)}</select></label>{form.location==='Custom'&&<label>Custom location<input value={form.customLocation} onChange={e=>setForm({...form,customLocation:e.target.value})}/></label>}<label>Estimated distance<input value={form.estimatedDistance} onChange={e=>setForm({...form,estimatedDistance:e.target.value})} placeholder="e.g. 1.2"/></label><label>Unit<select value={form.distanceUnit} onChange={e=>setForm({...form,distanceUnit:e.target.value})}><option>km</option><option>m</option></select></label><label className="span-2">Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label className="span-2">Photos<input type="file" accept="image/*" multiple onChange={e=>setPhotos(Array.from(e.target.files||[]).slice(0,4))}/><small className="field-hint">Up to 4 images. They are uploaded to the hostel's Google Drive folder after the hostel record is created.</small></label><div className="span-2 room-editor"><h4>Room types & prices</h4>{form.rooms.map((r:any,i:number)=><div className="room-edit-row" key={r.roomType}><b>{r.roomType}</b><input placeholder="Monthly rent" value={r.monthlyRent} onChange={e=>{const rooms=[...form.rooms];rooms[i]={...rooms[i],monthlyRent:e.target.value};setForm({...form,rooms})}}/><select value={r.availabilityStatus} onChange={e=>{const rooms=[...form.rooms];rooms[i]={...rooms[i],availabilityStatus:e.target.value};setForm({...form,rooms})}}><option>AVAILABLE</option><option>LIMITED</option><option>FULL</option></select></div>)}</div><label>Landlord name<input value={form.landlordName} onChange={e=>setForm({...form,landlordName:e.target.value})}/></label><label>Landlord phone<input value={form.landlordPhone} onChange={e=>setForm({...form,landlordPhone:e.target.value})}/></label><label>Caretaker name<input value={form.caretakerName} onChange={e=>setForm({...form,caretakerName:e.target.value})}/></label><label>Caretaker phone<input value={form.caretakerPhone} onChange={e=>setForm({...form,caretakerPhone:e.target.value})}/></label><label className="check-field"><input type="checkbox" checked={form.wifiAvailable} onChange={e=>setForm({...form,wifiAvailable:e.target.checked})}/> Wi‑Fi available</label><label>Water payment<input value={form.waterPayment} onChange={e=>setForm({...form,waterPayment:e.target.value})} placeholder="e.g. included"/></label><label>Electricity payment<input value={form.electricityPayment} onChange={e=>setForm({...form,electricityPayment:e.target.value})}/></label>{msg&&<div className="arena-notice span-2"><AlertTriangle size={16}/>{msg}</div>}<div className="form-actions span-2"><button type="button" className="arena-btn arena-btn-soft" onClick={onClose}>Cancel</button><button className="arena-btn arena-btn-primary" disabled={busy}>{busy?<><RefreshCw className="spin" size={16}/> Submitting…</>:<><CheckCircle2 size={16}/> Submit for verification</>}</button></div></form></div></div>;
}

function CommunityView() {
  const [tab,setTab]=useState<'help'|'roommates'|'social'>('help');
  const [requests,setRequests]=useState<CommunityRequest[]>([]); const [roommates,setRoommates]=useState<RoommatePost[]>([]); const [social,setSocial]=useState<HookupPost[]>([]);
  const [show,setShow]=useState(false); const [busy,setBusy]=useState(false); const [msg,setMsg]=useState('');
  const load=async()=>{const [a,b,c]=await Promise.all([apiClient.post<any>({}, {action:'getCommunityRequests'}),apiClient.post<any>({}, {action:'getRoommatePosts'}),apiClient.post<any>({}, {action:'getHookupPosts'})]);setRequests(a.data?.requests||[]);setRoommates(b.data?.posts||[]);setSocial(c.data?.posts||[]);};
  useEffect(()=>{load()},[]);
  const accept=async(id:string)=>{const r=await apiClient.post({requestId:id},{action:'acceptCommunityRequest'}, {authenticated:true});if(r.success)load();else setMsg(r.error?.message||'Could not accept request.');};
  const submit=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();setBusy(true);setMsg('');const data=Object.fromEntries(new FormData(e.currentTarget).entries());let action='createCommunityRequest';if(tab==='roommates')action='createRoommatePost';if(tab==='social')action='createHookupPost';if(tab==='social'&&data.ageConfirmed18!=='on'){setMsg('You must confirm you are 18 or older.');setBusy(false);return;}const r=await apiClient.post(data,{action}, {authenticated:true});setBusy(false);if(r.success){setShow(false);e.currentTarget.reset();load()}else setMsg(r.error?.message||'Could not publish post.');};
  return <div className="arena-page"><div className="arena-page-title"><div><Pill tone="blue"><Users size={13}/> COMMUNITY</Pill><h1>People helping people.</h1><p>Help requests, roommate matching and an anonymous 18+ social board — with WhatsApp as the connection layer.</p></div><button className="arena-btn arena-btn-primary" onClick={()=>setShow(true)}><Plus size={17}/> Create post</button></div>
    <div className="community-tabs"><button className={tab==='help'?'active':''} onClick={()=>setTab('help')}><HandHelping size={16}/> Help</button><button className={tab==='roommates'?'active':''} onClick={()=>setTab('roommates')}><BedDouble size={16}/> Roommates</button><button className={tab==='social'?'active':''} onClick={()=>setTab('social')}><Heart size={16}/> Anonymous 18+</button></div>
    {msg&&<div className="arena-notice"><AlertTriangle size={16}/>{msg}</div>}
    {tab==='help'&&<div className="community-grid">{requests.length?requests.map(r=><Card key={r.requestId}><div className="card-top"><div><Pill tone="blue">{r.category||'GENERAL'}</Pill><h3>{r.title}</h3></div><span className="muted"><MapPin size={13}/> {r.location||'Chuka'}</span></div><p className="post-text">{r.description}</p><div className="post-footer"><span><Clock3 size={14}/> Open request</span><button className="arena-btn arena-btn-primary" onClick={()=>accept(r.requestId)}>I can help <HandHelping size={15}/></button></div></Card>):<EmptyState icon={HandHelping} title="No open help requests" text="Create the first one when you need a hand."/>}</div>}
    {tab==='roommates'&&<div className="community-grid">{roommates.length?roommates.map(p=><Card key={p.postId}><div className="card-top"><div><Pill tone="green">ROOMMATE</Pill><h3>{p.title}</h3></div><span className="muted"><MapPin size={13}/> {p.location}</span></div><p className="post-text">{p.description}</p><div className="roommate-meta"><b>{p.roomType}</b><span>{money(p.monthlyRent)} / month</span><span>{money(p.contributionAmount)} contribution</span></div><div className="post-footer"><span><Users size={14}/> {p.currentRoommates||0}/{p.roommatesNeeded||1} spots</span><a className="arena-btn arena-btn-whatsapp" target="_blank" rel="noreferrer" href={whatsappUrl(`Hi, I saw your Chuka Arena roommate post: ${p.title}`)}><MessageCircle size={15}/> WhatsApp</a></div></Card>):<EmptyState icon={BedDouble} title="No roommate posts" text="Post what you need and connect privately on WhatsApp."/>}</div>}
    {tab==='social'&&<><Card className="privacy-banner"><LockKeyhole size={19}/><div><b>Anonymous by design</b><span>Your public card uses an alias only. Real account identity is kept server-side. Report or delete posts if needed.</span></div></Card><div className="community-grid">{social.length?social.map(p=><Card key={p.postId}><div className="card-top"><div><Pill tone="purple">18+ · {p.ageBand||'ADULT'}</Pill><h3>{p.publicAlias}</h3></div><span className="muted"><MapPin size={13}/> {p.locationArea||'Chuka'}</span></div><p className="post-text">{p.aboutText}</p><div className="interest-row">{String(p.interests||'').split(',').filter(Boolean).slice(0,5).map((x:string)=><span key={x}>{x.trim()}</span>)}</div><div className="post-footer"><a className="arena-btn arena-btn-whatsapp" target="_blank" rel="noreferrer" href={whatsappUrl(`Hi, I saw your anonymous Chuka Arena post from ${p.publicAlias}.`)}><MessageCircle size={15}/> WhatsApp</a><button className="icon-btn" title="Report" onClick={async()=>{await apiClient.post({targetType:'HOOKUP',targetId:p.postId,reason:'Report from community'}, {action:'reportCommunityItem'}, {authenticated:true});setMsg('Report submitted.')}}><Flag size={15}/></button></div></Card>):<EmptyState icon={Heart} title="No anonymous posts yet" text="18+ only. Keep posts respectful and use the report controls when needed."/>}</div></>}
    {show&&<div className="arena-modal-backdrop"><div className="arena-modal"><button className="modal-close" onClick={()=>setShow(false)}><X/></button><div className="modal-header"><Pill tone="blue">NEW {tab==='help'?'HELP REQUEST':tab==='roommates'?'ROOMMATE POST':'ANONYMOUS 18+ POST'}</Pill><h2>Share with the community</h2></div><form onSubmit={submit} className="form-grid"><label className="span-2">Title<input required name="title" placeholder={tab==='help'?'What do you need help with?':tab==='roommates'?'Looking for a roommate…':'What kind of connection are you looking for?'}/></label><label className="span-2">Description<textarea required name={tab==='social'?'aboutText':'description'} placeholder="Give enough context for someone to respond safely."/></label>{tab!=='help'&&<><label>Location<input name={tab==='social'?'location':'location'} placeholder="Ndagani / Marine…"/></label><label>{tab==='roommates'?'Room type':'Age band'}{tab==='roommates'?<select name="roomType" defaultValue="Bedsitter">{roomTypes.map(x=><option key={x}>{x}</option>)}</select>:<select name="ageBand" defaultValue="18-24"><option>18-24</option><option>25-34</option><option>35+</option></select>}</label></>}{tab==='roommates'&&<><label>Monthly rent<input name="monthlyRent" type="number"/></label><label>Contribution<input name="contributionAmount" type="number"/></label><label>Roommates needed<input name="roommatesNeeded" type="number" min="1" defaultValue="1"/></label></>}{tab==='social'&&<><label className="span-2">Interests<input name="interests" placeholder="music, gaming, walks…"/></label><label className="check-field span-2"><input type="checkbox" name="ageConfirmed18"/> I confirm I am 18 or older.</label><div className="span-2 privacy-note"><EyeOff size={15}/> No real name or phone number is shown publicly.</div></>}{msg&&<div className="arena-notice span-2">{msg}</div>}<div className="form-actions span-2"><button type="button" className="arena-btn arena-btn-soft" onClick={()=>setShow(false)}>Cancel</button><button disabled={busy} className="arena-btn arena-btn-primary">{busy?'Publishing…':'Publish post'}</button></div></form></div></div>}
  </div>;
}

function EFootballView() {
  const [tab,setTab]=useState<'competitions'|'cup'|'league'|'entries'>('competitions');
  return <div className="arena-page"><div className="arena-page-title"><div><Pill tone="green"><Gamepad2 size={13}/> eFOOTBALL</Pill><h1>Compete inside the Arena.</h1><p>Tournaments, leagues, fixtures, registrations and your player profile remain on the existing eFootball engine.</p></div></div><div className="community-tabs efootball-tabs"><button className={tab==='competitions'?'active':''} onClick={()=>setTab('competitions')}>Discover</button><button className={tab==='cup'?'active':''} onClick={()=>setTab('cup')}>Weekly Cup</button><button className={tab==='league'?'active':''} onClick={()=>setTab('league')}>League</button><button className={tab==='entries'?'active':''} onClick={()=>setTab('entries')}>My entries</button></div><Card className="efootball-stage">{tab==='competitions'&&<CompetitionList/>}{tab==='cup'&&<KnockoutView/>}{tab==='league'&&<LeagueView/>}{tab==='entries'&&<MyRegistrationsView/>}</Card></div>;
}

function Shell({ active, setActive, children, onAdmin }: { active:DashboardTab; setActive:(t:DashboardTab)=>void; children:React.ReactNode; onAdmin:()=>void }) {
  const { user, signOut } = useAuth(); const { isAdmin } = useAdmin(); const [mobile,setMobile]=useState(false);
  const nav=[['home','Home',Home],['efootball','eFootball',Gamepad2],['hostels','Hostels',House],['community','Community',Users],['profile','Profile',UserRound]] as const;
  return <div className="arena-app"><div className="arena-bg"/><header className="arena-header"><div className="arena-brand"><img src={CHUKA_CREST_URL} onError={e=>{e.currentTarget.src=CHUKA_CREST_FALLBACK}} alt="Chuka"/><div><b>CHUKA <span>ARENA</span></b><small>Student community platform</small></div></div><nav className="arena-nav">{nav.map(([id,label,Icon])=><button key={id} className={active===id?'active':''} onClick={()=>setActive(id)}><Icon size={16}/>{label}</button>)}</nav><div className="arena-user"><button className="avatar" onClick={()=>setActive('profile')}>{user?.photoURL?<img src={user.photoURL} alt=""/>:<span>{(user?.displayName||'U').slice(0,1).toUpperCase()}</span>}</button><div className="user-meta"><b>{user?.displayName||'Student'}</b><span>{isAdmin?'Administrator':'Chuka student'}</span></div>{isAdmin&&<button className="admin-mini" onClick={onAdmin}><Shield size={14}/></button>}<button className="logout-mini" onClick={signOut} title="Sign out"><LogOut size={16}/></button><button className="mobile-menu" onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button></div></header>{mobile&&<div className="mobile-nav">{nav.map(([id,label,Icon])=><button key={id} className={active===id?'active':''} onClick={()=>{setActive(id);setMobile(false)}}><Icon size={17}/>{label}</button>)}{isAdmin&&<button onClick={onAdmin}><Shield size={17}/> Admin</button>}</div>}<main className="arena-main"><OfficialBrandBanner theme="dark" variant="compact" className="arena-brand-banner"/>{children}</main><footer className="arena-footer"><span>Chuka Arena · Student-first digital hub</span><span>Google Sheets + Apps Script backend · WhatsApp community layer</span></footer></div>;
}

export const DashboardPage: React.FC = () => {
  const [active,setActive]=useState<DashboardTab>('home'); const { isAdmin }=useAdmin();
  useEffect(()=>{const hash=window.location.hash.replace('#',''); if(['home','efootball','hostels','community','profile'].includes(hash))setActive(hash as DashboardTab);},[]);
  const navigate=(tab:DashboardTab)=>{setActive(tab);window.history.replaceState({},'',`#${tab}`);window.scrollTo({top:0,behavior:'smooth'});};
  let content:React.ReactNode;
  if(active==='home')content=<HomeView onNavigate={navigate}/>; else if(active==='hostels')content=<HostelView/>; else if(active==='community')content=<CommunityView/>; else if(active==='efootball')content=<EFootballView/>; else if(active==='profile')content=<div className="arena-page"><ProfileView/></div>; else content=<div className="arena-page"><AdminMasterHub/></div>;
  return <Shell active={active} setActive={navigate} onAdmin={()=>isAdmin&&navigate('admin')}>{content}</Shell>;
};
