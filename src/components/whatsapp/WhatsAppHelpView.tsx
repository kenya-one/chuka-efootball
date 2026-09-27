import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Phone,
  Printer,
  ExternalLink,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { ThemeMode, WhatsAppGroup } from '../../types';
import { CHUKA_CREST_FALLBACK, CHUKA_CREST_URL } from '../common/ChukaOfficialCrest';
import { EFOOTBALL_LOGO_URL } from '../rules/OfficialMatchRulesDocument';
import { TournamentAdminService } from '../../services/tournamentAdminService';

interface WhatsAppHelpViewProps {
  theme: ThemeMode;
}

export const WhatsAppHelpView: React.FC<WhatsAppHelpViewProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    TournamentAdminService.getWhatsAppGroups()
      .then((data) => {
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setGroups(data.filter((g) => g.active !== false && Boolean(g.group_url)));
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const fallbackChannels = [
    {
      id: 'WG-1',
      title: 'Freshmen & General Community',
      description: 'Official general community for all campus players, freshmen, and casual matchmaking.',
      url: 'https://chat.whatsapp.com/Byo7gA36vQC7Xu9v0hjmMq',
      badge: 'Community',
    },
    {
      id: 'WG-2',
      title: 'Division 1 / Premiership Competitors',
      description: 'Dedicated channel for active League and top-flight tournament contenders.',
      url: 'https://chat.whatsapp.com/HzBUX4qLTcPEmT35vO5tSf',
      badge: 'Competitive',
    },
    {
      id: 'WG-3',
      title: 'Tournament Operations & Match Helpdesk',
      description: 'Dispute filing, score submission assistance, and urgent match support.',
      url: 'https://chat.whatsapp.com/IVY8h3s16MlBmTgmWu6ZIg',
      badge: 'Support & Disputes',
    },
  ];

  const displayChannels = groups.length > 0
    ? groups.map((g) => ({
        id: g.group_id || `WG-${g.group_number}`,
        title: g.name,
        description: g.description,
        url: g.group_url,
        badge: `Slot ${g.group_number}`,
      }))
    : fallbackChannels;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="whatsapp-help-page"
      className={`min-h-screen w-full transition-colors ${
        isDark ? 'bg-[#0a0f0b]' : 'bg-[#f4f6f4]'
      }`}
    >
      {/* Top Document Utility Bar (Excluded from Print) */}
      <div className="no-print sticky top-16 z-30 w-full bg-[#111612]/90 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <Shield className="w-4 h-4 text-[#22c55e]" />
            <span className="font-bold text-white uppercase tracking-wider">
              Official University Information Gazette
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              id="helpdesk-quick-chat-btn"
              href="https://wa.me/254180752220"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>WhatsApp Officer</span>
            </a>

            <button
              type="button"
              id="helpdesk-print-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official White Document Body */}
      <div className="document-page-wrapper py-6 sm:py-10">
        <div className="document" id="official-helpdesk-document">
          {/* ===== HEADER ===== */}
          <header className="doc-header">
            <div className="logo-left">
              <img
                src={CHUKA_CREST_URL}
                alt="Chuka University Crest"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = CHUKA_CREST_FALLBACK;
                }}
              />
            </div>
            <div className="title">
              <h1>CHUKA eFOOTBALL</h1>
              <div className="subtitle">Official University eFootball Esports Hub</div>
            </div>
            <div className="logo-right">
              <img
                src={EFOOTBALL_LOGO_URL}
                alt="eFootball Logo"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </header>

          <hr className="doc-divider" />
          <div className="powered">Powered by Google Sheets + Apps Script</div>

          {/* ===== DIRECTORY SECTION ===== */}
          <h2 className="section-title">Official Help Desk &amp; Communication Directory</h2>

          {/* HELP DESK OFFICER TABLE */}
          <h3 className="subsection-title">📞 Help Desk &amp; Payment Officer</h3>
          <table className="doc-table">
            <thead>
              <tr>
                <th>Officer</th>
                <th>Title / Designation</th>
                <th>Duties &amp; Contact Access</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Sidney Wafula</td>
                <td>Help Desk &amp; Verification Lead</td>
                <td>
                  <div className="space-y-1">
                    <p>
                      Responsible for player onboarding, registration questions, score reporting inquiries, and payment-related assistance for all official competitions.
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-3 font-mono text-[11px]">
                      <span>
                        Telephone:{' '}
                        <a href="tel:0180752220" className="font-bold text-black underline">
                          0180752220
                        </a>
                      </span>
                      <span>&bull;</span>
                      <a
                        href="https://wa.me/254180752220"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-black underline"
                      >
                        <MessageCircle className="w-3 h-3 text-[#16a34a]" />
                        <span>Chat Directly on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* OFFICIAL CHANNELS TABLE */}
          <h3 className="subsection-title">💬 Official WhatsApp Channels &amp; Groups</h3>
          <table className="doc-table">
            <thead>
              <tr>
                <th>Channel ID</th>
                <th>Channel Name</th>
                <th>Description &amp; Action</th>
              </tr>
            </thead>
            <tbody>
              {displayChannels.map((ch) => (
                <tr key={ch.id}>
                  <td>{ch.id}</td>
                  <td>
                    <span>{ch.title}</span>
                    <span className="block text-[10px] text-gray-500 uppercase mt-0.5">
                      [{ch.badge}]
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span>{ch.description}</span>
                      <a
                        href={ch.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-black underline flex-shrink-0 text-xs hover:text-emerald-700"
                      >
                        <span>Join Channel</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* NOTE */}
          <p className="doc-note">
            <strong>Important Support Guidelines:</strong> Match disputes must be filed within{' '}
            <strong>30 minutes</strong> of match conclusion accompanied by screenshots. Tournament entry
            fees are confirmed by Sidney Wafula before brackets are generated.
          </p>

          {/* ===== FOOTER ===== */}
          <footer className="doc-footer">
            <div className="help-desk">
              Help Desk:{' '}
              <a href="tel:0180752220" id="info-helpdesk-link">
                Sidney Wafula (0180752220)
              </a>
            </div>
            <div className="fair-play">Fair Play Standard • Chuka eFootball</div>
          </footer>
        </div>
      </div>
    </div>
  );
};
