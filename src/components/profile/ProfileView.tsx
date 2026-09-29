import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Shield, LogOut, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Player, GoogleAuthUser, ThemeMode } from '../../types';
import { GoogleSheetsService } from '../../services/googleSheetsService';
import { PlayerProfileCard } from './PlayerProfileCard';

interface ProfileViewProps {
  authUser: GoogleAuthUser | null;
  currentPlayer: Player | null;
  isGuest: boolean;
  theme: ThemeMode;
  onSignOut: () => void;
  onPlayerRegistered: (player: Player) => void;
  onEnterSignIn: () => void;
}

/**
 * User-facing profile page.
 *
 * This page intentionally focuses on the signed-in student's own data.
 * Technical Firebase/Google Sheets connection diagnostics do not belong
 * in the normal Profile tab.
 */
export const ProfileView: React.FC<ProfileViewProps> = ({
  authUser,
  currentPlayer,
  isGuest,
  theme,
  onSignOut,
  onPlayerRegistered,
  onEnterSignIn,
}) => {
  const isDark = theme === 'dark';
  const [usernameInput, setUsernameInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState(authUser?.displayName || '');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  useEffect(() => {
    if (authUser?.displayName) setDisplayNameInput(authUser.displayName);
  }, [authUser?.displayName]);

  const handleUsernameBlur = async () => {
    const trimmed = usernameInput.trim().toUpperCase();
    if (!trimmed) return setUsernameTaken(false);
    setIsCheckingUsername(true);
    try {
      const taken = await GoogleSheetsService.checkUsernameExists(trimmed);
      setUsernameTaken(taken);
      setRegError(taken ? 'This eFootball username is already registered.' : null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleRegisterPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = usernameInput.trim().toUpperCase();
    const cleanWhatsApp = whatsappInput.trim();
    if (!cleanUsername) return setRegError('eFootball username is required.');
    if (!cleanWhatsApp) return setRegError('WhatsApp number is required for official match communication.');
    if (!authUser) return setRegError('Please sign in first.');

    setIsSubmittingReg(true);
    setRegError(null);
    try {
      const res = await GoogleSheetsService.registerPlayer({
        eFootballUsername: cleanUsername,
        displayName: displayNameInput.trim() || authUser.displayName,
        whatsApp: cleanWhatsApp,
        googleUid: authUser.uid,
        profileImage: authUser.photoURL,
      });
      if (res.success && res.player) onPlayerRegistered(res.player);
      else setRegError(res.error || 'Failed to create your player profile.');
    } catch (err: any) {
      setRegError(err?.message || 'Registration error.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  if (isGuest) {
    return (
      <div className="profile-user-page">
        <div className="profile-user-hero">
          <div>
            <span className="arena-pill arena-pill-amber">PROFILE</span>
            <h1>Your Profile</h1>
            <p>Sign in to see and update your personal and eFootball information.</p>
          </div>
          <button className="arena-btn arena-btn-primary" onClick={onEnterSignIn}>Sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-user-page">
      <div className="profile-user-hero">
        <div>
          <span className="arena-pill arena-pill-green"><User size={13}/> MY PROFILE</span>
          <h1>My Profile</h1>
          <p>View your account information and update your details whenever they change.</p>
        </div>
        <button type="button" className="arena-btn arena-btn-soft" onClick={onSignOut}>
          <LogOut size={16}/> Sign out
        </button>
      </div>

      {authUser && (
        <div className={`profile-account-card ${isDark ? '' : 'light'}`}>
          <div className="profile-avatar">
            {authUser.photoURL ? (
              <img src={authUser.photoURL} alt="Profile" referrerPolicy="no-referrer" />
            ) : (
              <span>{(authUser.displayName || authUser.email || 'U').slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="profile-account-main">
            <h2>{currentPlayer?.FullName || currentPlayer?.DisplayName || authUser.displayName || 'Chuka Student'}</h2>
            <div className="profile-data-grid">
              <div><Mail size={15}/><span>Email<b>{authUser.email || currentPlayer?.Email || 'Not available'}</b></span></div>
              <div><User size={15}/><span>Account name<b>{authUser.displayName || currentPlayer?.DisplayName || 'Not set'}</b></span></div>
              <div><Phone size={15}/><span>Phone<b>{currentPlayer?.PhoneNumber || currentPlayer?.Phone || 'Not set'}</b></span></div>
              <div><Shield size={15}/><span>Player ID<b>{currentPlayer?.PlayerID || 'Not registered yet'}</b></span></div>
            </div>
          </div>
        </div>
      )}

      {currentPlayer ? (
        <PlayerProfileCard
          player={currentPlayer}
          onPlayerUpdated={(updated) => onPlayerRegistered(updated)}
          onUpdated={(updated) => onPlayerRegistered(updated)}
        />
      ) : (
        <div className="profile-register-card">
          <div className="profile-register-heading">
            <Shield size={20}/>
            <div><h2>Create your eFootball profile</h2><p>Your Google account is connected. Add your gamer details once.</p></div>
          </div>
          {regError && <div className="arena-notice"><AlertTriangle size={16}/>{regError}</div>}
          <form onSubmit={handleRegisterPlayer} className="profile-register-form">
            <label>eFootball username
              <div className="profile-input-wrap">
                <input required value={usernameInput} onChange={e=>{setUsernameInput(e.target.value.toUpperCase());setUsernameTaken(false)}} onBlur={handleUsernameBlur} placeholder="e.g. LAURENCE_WG"/>
                {isCheckingUsername && <RefreshCw size={15} className="spin"/>}
              </div>
            </label>
            <label>Display name
              <input value={displayNameInput} onChange={e=>setDisplayNameInput(e.target.value)} placeholder="Your name"/>
            </label>
            <label>WhatsApp number
              <input required type="tel" value={whatsappInput} onChange={e=>setWhatsappInput(e.target.value)} placeholder="+254712345678"/>
            </label>
            <button className="arena-btn arena-btn-primary" disabled={isSubmittingReg || usernameTaken}>
              {isSubmittingReg ? <><RefreshCw size={15} className="spin"/> Creating…</> : <><CheckCircle2 size={15}/> Create profile</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
