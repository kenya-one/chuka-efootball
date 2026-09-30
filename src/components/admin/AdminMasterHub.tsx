import React, { useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { AdminOverviewView } from './AdminOverviewView';
import { AdminKnockoutView } from './AdminKnockoutView';
import { AdminLeagueView } from './AdminLeagueView';
import { AdminPlayersView } from './AdminPlayersView';
import { AdminRegistrationsView } from './AdminRegistrationsView';
import { AdminPaymentsView } from './AdminPaymentsView';
import { AdminFixturesView } from './AdminFixturesView';
import { AdminAnnouncementsView } from './AdminAnnouncementsView';
import { AdminDisputesView } from './AdminDisputesView';
import { AdminWhatsAppView } from './AdminWhatsAppView';
import { AdminAuditLogsView } from './AdminAuditLogsView';
import { AdminCompetitionsView } from './AdminCompetitionsView';
import { AdminTrendsView } from './AdminTrendsView';
import { AdminJobsGigsView } from './AdminJobsGigsView';
import { AdminHostelsView } from './AdminHostelsView';
import {
  AlertTriangle,
  Award,
  BarChart3,
  CheckSquare,
  ChevronRight,
  CreditCard,
  FileText,
  House,
  Layers,
  LayoutDashboard,
  Menu,
  Megaphone,
  MessageCircle,
  Play,
  Shield,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AdminSection =
  | 'overview'
  | 'competitions'
  | 'knockout'
  | 'league'
  | 'players'
  | 'registrations'
  | 'payments'
  | 'fixtures'
  | 'disputes'
  | 'whatsapp'
  | 'audit'
  | 'announcements'
  | 'trends'
  | 'jobs'
  | 'hostels';

type AdminNavItem = {
  id: AdminSection;
  label: string;
  icon: LucideIcon;
  group: 'Command' | 'eFootball' | 'Community';
  accent?: string;
};

const ADMIN_NAV: AdminNavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, group: 'Command' },
  { id: 'hostels', label: 'Hostel Approvals', icon: House, group: 'Command', accent: 'emerald' },
  { id: 'competitions', label: 'All Competitions', icon: Layers, group: 'eFootball' },
  { id: 'knockout', label: 'Weekly Knockout', icon: Trophy, group: 'eFootball' },
  { id: 'league', label: 'Leagues', icon: Award, group: 'eFootball' },
  { id: 'players', label: 'Players', icon: Users, group: 'eFootball' },
  { id: 'registrations', label: 'Registrations', icon: CheckSquare, group: 'eFootball' },
  { id: 'payments', label: 'Payments', icon: CreditCard, group: 'eFootball' },
  { id: 'fixtures', label: 'Fixtures & Results', icon: Play, group: 'eFootball' },
  { id: 'disputes', label: 'Match Disputes', icon: AlertTriangle, group: 'eFootball' },
  { id: 'whatsapp', label: 'WhatsApp Groups', icon: MessageCircle, group: 'Community' },
  { id: 'jobs', label: 'Jobs & Gigs', icon: Users, group: 'Community' },
  { id: 'trends', label: 'Trends', icon: BarChart3, group: 'Community' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, group: 'Community' },
  { id: 'audit', label: 'Audit Logs', icon: FileText, group: 'Command' },
];

const GROUPS: AdminNavItem['group'][] = ['Command', 'eFootball', 'Community'];

export const AdminMasterHub: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [targetFixtureCompId, setTargetFixtureCompId] = useState<string | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeItem = useMemo(
    () => ADMIN_NAV.find(item => item.id === activeSection) || ADMIN_NAV[0],
    [activeSection]
  );

  const selectSection = (section: AdminSection) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  const handleSelectCompetitionForFixtures = (competitionId: string) => {
    setTargetFixtureCompId(competitionId);
    selectSection('fixtures');
  };

  const renderNavigation = (mobile = false) => (
    <nav className={mobile ? 'space-y-5' : 'space-y-5'} aria-label="Admin navigation">
      {GROUPS.map(group => {
        const items = ADMIN_NAV.filter(item => item.group === group);
        return (
          <div key={group}>
            <div className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
              {group}
            </div>
            <div className="space-y-1">
              {items.map(item => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectSection(item.id)}
                    className={`group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-all ${
                      active
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/15'
                        : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-black/10' : 'bg-white/[0.04] border border-white/5'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.id === 'hostels' && !active && (
                      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black text-emerald-300">MOD</span>
                    )}
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-[calc(100vh-7rem)] text-white">
      <div className="rounded-[2rem] border border-white/10 bg-[#07100b]/95 shadow-2xl shadow-black/30 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 border-b border-white/10 bg-[#08100c]/95 backdrop-blur-xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-300">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">Admin Console</p>
                <p className="truncate text-sm font-black text-white">{activeItem.label}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(v => !v)}
              className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-200"
              aria-label="Open admin menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="mt-3 max-h-[70vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a130e] p-3 shadow-2xl">
              {renderNavigation(true)}
            </div>
          )}
        </div>

        <div className="flex">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-[270px] shrink-0 border-r border-white/10 bg-black/20 p-4">
            <div className="sticky top-4">
              <div className="rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/10 via-white/[0.02] to-transparent p-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-300">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-white">Chuka Arena</p>
                    <p className="text-[10px] text-emerald-300 font-bold mt-0.5">ADMIN CONTROL</p>
                  </div>
                </div>
                <p className="mt-3 truncate text-[10px] text-gray-500 font-mono">{user?.email || 'Authenticated admin'}</p>
              </div>
              <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-1 scrollbar-thin">
                {renderNavigation()}
              </div>
            </div>
          </aside>

          {/* Main admin workspace */}
          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-7">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/[0.07] via-transparent to-amber-500/[0.05] p-4 sm:p-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-300">
                      Secure Admin Area
                    </span>
                    <span className="text-[10px] text-gray-600">•</span>
                    <span className="text-[10px] text-gray-500 font-mono truncate">{user?.email || 'admin'}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">{activeItem.label}</h1>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">Manage Chuka Arena operations without exposing normal student navigation.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Admin online
                </div>
              </div>
            </div>

            <div className="animate-in fade-in duration-150">
              {activeSection === 'overview' && (
                <AdminOverviewView onNavigateSection={(sec) => selectSection(sec as AdminSection)} />
              )}
              {activeSection === 'competitions' && <AdminCompetitionsView />}
              {activeSection === 'hostels' && <AdminHostelsView />}
              {activeSection === 'knockout' && (
                <AdminKnockoutView onSelectCompetitionForFixtures={handleSelectCompetitionForFixtures} />
              )}
              {activeSection === 'league' && (
                <AdminLeagueView onSelectCompetitionForFixtures={handleSelectCompetitionForFixtures} />
              )}
              {activeSection === 'players' && <AdminPlayersView />}
              {activeSection === 'registrations' && <AdminRegistrationsView />}
              {activeSection === 'payments' && <AdminPaymentsView />}
              {activeSection === 'fixtures' && <AdminFixturesView initialCompetitionId={targetFixtureCompId} />}
              {activeSection === 'disputes' && <AdminDisputesView />}
              {activeSection === 'whatsapp' && <AdminWhatsAppView />}
              {activeSection === 'announcements' && <AdminAnnouncementsView />}
              {activeSection === 'jobs' && <AdminJobsGigsView />}
              {activeSection === 'trends' && <AdminTrendsView />}
              {activeSection === 'audit' && <AdminAuditLogsView />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
