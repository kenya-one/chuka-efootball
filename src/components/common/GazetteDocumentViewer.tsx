import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, ExternalLink } from 'lucide-react';
import {
  Competition,
  CompetitionRegistration,
  LeagueStanding,
  MatchFixture,
} from '../../types';
import { INITIAL_MATCH_RULES } from '../../data/matchRulesData';
import { CHUKA_CREST_URL } from './ChukaOfficialCrest';
import { ShareButton } from './ShareButton';
import {
  buildBracketPlan,
  formatLongDate,
  formatShortDate,
  getCompetitionShareUrl,
  splitRegistrations,
} from '../../utils/competitionUtils';

export type GazetteKind = 'rules' | 'registered' | 'bracket' | 'fixtures' | 'standings' | 'final';

interface GazetteDocumentViewerProps {
  kind: GazetteKind;
  competition: Competition;
  registrations: CompetitionRegistration[];
  fixtures?: MatchFixture[];
  standings?: LeagueStanding[];
  onClose: () => void;
}

const META: Record<GazetteKind, { title: string; code: string }> = {
  rules: { title: 'Official Competition Rules & Regulations', code: 'RR' },
  registered: { title: 'Register of Entrants', code: 'RE' },
  bracket: { title: 'Knockout Bracket Notice', code: 'KB' },
  fixtures: { title: 'League Fixtures Notice', code: 'LF' },
  standings: { title: 'Official League Standings', code: 'LS' },
  final: { title: 'Final Results & Awards Notice', code: 'FR' },
};

const urlFor = (c: Competition, k: GazetteKind): string | undefined =>
  ({
    rules: c.RulesDocumentURL,
    registered: c.RegisteredPlayersDocumentURL,
    bracket: c.KnockoutBracketDocumentURL,
    fixtures: c.LeagueFixturesDocumentURL,
    standings: c.StandingsDocumentURL,
    final: c.FinalResultsDocumentURL,
  }[k]);

const Section: React.FC<{ n?: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <section className="gz-section">
    <h3 className="gz-section-title">{n ? `${n}. ` : ''}{title}</h3>
    {children}
  </section>
);

const KV: React.FC<{ rows: [string, React.ReactNode][] }> = ({ rows }) => (
  <table className="doc-table gz-kv">
    <tbody>
      {rows.map(([k, v]) => (
        <tr key={k}>
          <td>{k}</td>
          <td>{v}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const Notice: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="doc-note">{children}</p>;

export const GazetteDocumentViewer: React.FC<GazetteDocumentViewerProps> = ({
  kind,
  competition: c,
  registrations,
  fixtures = [],
  standings = [],
  onClose,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const isLeague = String(c.CompetitionType).toUpperCase() === 'LEAGUE';
  const meta = META[kind];
  const { verified, unverified } = useMemo(() => splitRegistrations(registrations), [registrations]);
  const compFixtures = useMemo(() => fixtures.filter((f) => f.CompetitionID === c.CompetitionID), [fixtures, c]);

  const minPlayers = c.MinPlayers || (isLeague ? 500 : 1024);
  const maxPlayers = c.MaxPlayers || (isLeague ? 2048 : 1024);
  const till = c.PaymentTill || '6817863';
  const fee = c.EntryFee > 0 ? `KSh ${c.EntryFee}` : 'Free entry';
  const prize = c.PrizeAmount ? `KSh ${Number(c.PrizeAmount).toLocaleString()}` : 'To be announced';
  const year = new Date().getFullYear();
  const notice = `CEG/${year}/${(c.CompetitionID || 'XXX').replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase()}/${meta.code}`;
  const external = urlFor(c, kind);
  const shareUrl = getCompetitionShareUrl(c);
  const crest = CHUKA_CREST_URL;
  const localCrest = `${(import.meta as any).env?.BASE_URL || '/'}chuka-crest.png`;

  /* ---------- document bodies ---------- */

  const rulesBody = () => {
    const typeKey = isLeague ? 'League' : 'Knockout';
    const articles = INITIAL_MATCH_RULES.filter((r) => r.Competition === typeKey && r.Active !== false);
    return (
      <>
        <Section n={1} title="Competition Particulars">
          <KV
            rows={[
              ['Competition', c.Name],
              ['Reference', c.CompetitionID],
              ['Type', `${isLeague ? 'League' : 'Knockout'} (${c.Format || (isLeague ? 'Round Robin' : 'Single Elimination')})`],
              ['Division', c.Division || 'Open'],
              ['Entry Fee', fee],
              ['Payment', `M-Pesa Buy Goods, Till Number ${till}`],
              ['Winner’s Prize', prize],
              ['Entrants Required', `Minimum ${minPlayers.toLocaleString()} · Maximum ${maxPlayers.toLocaleString()} verified players`],
              ['Registration Closes', formatLongDate(c.RegistrationEnd)],
              ['Competition Begins', formatLongDate(c.StartDate)],
            ]}
          />
        </Section>
        <Section n={2} title="Registration & Verification">
          <ol className="gz-list">
            <li>Every entrant must hold a Chuka eFootball player profile approved by the administration.</li>
            <li>The entry fee of {fee} is paid to Till Number {till}; the entrant then submits the payment reference.</li>
            <li>A submitted entry is listed as <strong>Unverified</strong> until the administration confirms the payment.</li>
            <li>Only <strong>Verified</strong> entrants count towards the competition’s capacity and are placed in the draw.</li>
            <li>Entries with false or unmatched payment references are rejected and removed from the register.</li>
          </ol>
        </Section>
        <Section n={3} title={isLeague ? 'League Regulations' : 'Knockout Regulations'}>
          <table className="doc-table">
            <thead>
              <tr><th>Article</th><th>Title</th><th>Provision</th></tr>
            </thead>
            <tbody>
              {articles.map((r, i) => (
                <tr key={r.RuleID || i}>
                  <td>{r.RuleID || `Art. ${i + 1}`}</td>
                  <td>{r.RuleTitle}</td>
                  <td>{r.RuleContent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Section n={4} title="Results, Screenshots & Disputes">
          <ol className="gz-list">
            <li>After each match both players capture the final-score screen showing both usernames.</li>
            <li>One player submits the result with the screenshot; the opponent confirms it or files a dispute.</li>
            <li>Disputed matches are decided by the administration on the evidence submitted. Its decision is final.</li>
            <li>Late, disconnected or unreported matches may be awarded as a forfeit.</li>
          </ol>
        </Section>
      </>
    );
  };

  const nameTable = (rows: CompetitionRegistration[], startLabel: string) => (
    <table className="doc-table gz-roster">
      <thead>
        <tr><th>No.</th><th>eFootball Username</th><th>Date Registered</th><th>Status</th></tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.RegistrationID || i}>
            <td>{i + 1}</td>
            <td>{r.eFootballUsername || '—'}</td>
            <td>{formatShortDate(r.RegisteredAt)}</td>
            <td>{startLabel}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const registeredBody = () => (
    <>
      <Section n={1} title="Summary of Entries">
        <KV
          rows={[
            ['Verified Entrants', `${verified.length.toLocaleString()} of ${maxPlayers.toLocaleString()}`],
            ['Unverified Entrants (awaiting payment approval)', unverified.length.toLocaleString()],
            ['Places Remaining', Math.max(0, maxPlayers - verified.length).toLocaleString()],
            ['Minimum To Proceed', minPlayers.toLocaleString()],
          ]}
        />
      </Section>
      <Section n={2} title="Part A — Verified Entrants">
        {verified.length === 0 ? (
          <p className="gz-empty">No entrant has been verified yet. Names appear here as soon as the administration confirms payment.</p>
        ) : nameTable(verified, 'Verified')}
      </Section>
      <Section n={3} title="Part B — Unverified Entrants">
        {unverified.length === 0 ? (
          <p className="gz-empty">There are no entries awaiting verification.</p>
        ) : nameTable(unverified, 'Unverified')}
      </Section>
      <Notice><strong>Note:</strong> An unverified entrant is not yet in the draw. Verification follows confirmation of payment to Till {till}.</Notice>
    </>
  );

  const bracketBody = () => {
    const size = Math.pow(2, Math.ceil(Math.log2(Math.max(2, maxPlayers))));
    const plan = buildBracketPlan(size);
    if (compFixtures.length > 0) {
      const rounds = Array.from(new Set(compFixtures.map((f) => f.Round || 'Round')));
      return (
        <>
          {rounds.map((round, ri) => (
            <Section key={round} n={ri + 1} title={round}>
              <table className="doc-table">
                <thead>
                  <tr><th>Match</th><th>Player One</th><th>Score</th><th>Player Two</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {compFixtures.filter((f) => (f.Round || 'Round') === round).map((f, i) => (
                    <tr key={f.FixtureID || i}>
                      <td>{i + 1}</td>
                      <td>{f.Player1Name}</td>
                      <td style={{ textAlign: 'center' }}>
                        {f.Player1Score ?? '–'} : {f.Player2Score ?? '–'}
                      </td>
                      <td>{f.Player2Name}</td>
                      <td>{f.Status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          ))}
        </>
      );
    }
    return (
      <>
        <Notice>
          <strong>Status:</strong> The bracket has not been drawn yet. {verified.length.toLocaleString()} of the required{' '}
          {minPlayers.toLocaleString()} players are verified. The draw is made automatically once the minimum is reached.
        </Notice>
        <Section n={1} title="How the Knockout Works">
          <ol className="gz-list">
            <li><strong>Registration.</strong> Players register and pay {fee} to Till {till}.</li>
            <li><strong>Verification.</strong> The administration verifies each payment. Only verified players enter the draw.</li>
            <li><strong>The Draw.</strong> When {minPlayers.toLocaleString()} players are verified, opponents are drawn at random and Round 1 is published here.</li>
            <li><strong>Single Elimination.</strong> The winner of each match advances. The loser is eliminated. There are no draws — extra time and penalties decide level games.</li>
            <li><strong>Results.</strong> Both players submit the final-score screenshot before the round deadline.</li>
            <li><strong>Champion.</strong> The last player standing wins the prize of {prize}.</li>
          </ol>
        </Section>
        <Section n={2} title={`Rounds for ${size.toLocaleString()} Players`}>
          <table className="doc-table">
            <thead>
              <tr><th>Round</th><th>Players Left</th><th>Matches</th></tr>
            </thead>
            <tbody>
              {plan.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td>{r.players.toLocaleString()}</td>
                  <td>{r.matches.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Section n={3} title="Illustration (8-Player Example)">
          <div className="gz-bracket" aria-label="Example bracket">
            {[
              { h: 'Quarter-Finals', items: ['Player A v Player B', 'Player C v Player D', 'Player E v Player F', 'Player G v Player H'] },
              { h: 'Semi-Finals', items: ['Winner QF1 v Winner QF2', 'Winner QF3 v Winner QF4'] },
              { h: 'Final', items: ['Winner SF1 v Winner SF2'] },
              { h: 'Champion', items: ['Winner of the Final'] },
            ].map((col) => (
              <div key={col.h} className="gz-bracket-col">
                <div className="gz-bracket-head">{col.h}</div>
                <div className="gz-bracket-body">
                  {col.items.map((it) => (
                    <div key={it} className="gz-bracket-box">{it}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </>
    );
  };

  const fixturesBody = () => {
    if (compFixtures.length > 0) {
      const rounds = Array.from(new Set(compFixtures.map((f) => f.Round || 'Matchday')));
      return (
        <>
          {rounds.map((round, ri) => (
            <Section key={round} n={ri + 1} title={round}>
              <table className="doc-table">
                <thead>
                  <tr><th>No.</th><th>Home</th><th>Score</th><th>Away</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {compFixtures.filter((f) => (f.Round || 'Matchday') === round).map((f, i) => (
                    <tr key={f.FixtureID || i}>
                      <td>{i + 1}</td>
                      <td>{f.Player1Name}</td>
                      <td style={{ textAlign: 'center' }}>{f.Player1Score ?? '–'} : {f.Player2Score ?? '–'}</td>
                      <td>{f.Player2Name}</td>
                      <td>{f.Status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          ))}
        </>
      );
    }
    return (
      <>
        <Notice>
          <strong>Status:</strong> Fixtures have not been published. {verified.length.toLocaleString()} of the required{' '}
          {minPlayers.toLocaleString()} players are verified. Fixtures are generated once the minimum is reached.
        </Notice>
        <Section n={1} title="How the League Works">
          <ol className="gz-list">
            <li><strong>Entry.</strong> Verified players are placed in one league table.</li>
            <li><strong>Fixtures.</strong> The administration generates the fixture list and publishes it in matchdays.</li>
            <li><strong>Playing.</strong> Each fixture is played before its matchday deadline, then reported with a screenshot.</li>
            <li><strong>Points.</strong> Win = 3 points · Draw = 1 point · Loss = 0 points.</li>
            <li><strong>Champion.</strong> The player top of the table at the close of the league wins {prize}.</li>
          </ol>
        </Section>
        <Section n={2} title="Specimen Fixture Notice">
          <table className="doc-table">
            <thead><tr><th>Matchday</th><th>Home</th><th>Score</th><th>Away</th><th>Status</th></tr></thead>
            <tbody>
              {[1, 2].map((d) => (
                <tr key={d}>
                  <td>Matchday {d}</td>
                  <td>Player {d === 1 ? 'A' : 'C'}</td>
                  <td style={{ textAlign: 'center' }}>– : –</td>
                  <td>Player {d === 1 ? 'B' : 'D'}</td>
                  <td>Scheduled</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </>
    );
  };

  const standingsBody = () => (
    <>
      {standings.length === 0 && (
        <Notice>
          <strong>Status:</strong> No match has been confirmed yet, so the table below is empty. It fills in automatically as results are confirmed.
        </Notice>
      )}
      <Section n={1} title="League Table">
        <table className="doc-table gz-standings">
          <thead>
            <tr>
              <th>Pos</th><th>Player</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.length === 0 ? (
              <tr><td colSpan={10} className="gz-empty" style={{ textAlign: 'center' }}>No standings yet</td></tr>
            ) : (
              standings.map((s, i) => (
                <tr key={s.PlayerID || i}>
                  <td>{i + 1}</td>
                  <td>{s.eFootballUsername}</td>
                  <td>{s.Played || 0}</td><td>{s.Wins || 0}</td><td>{s.Draws || 0}</td><td>{s.Losses || 0}</td>
                  <td>{s.GoalsFor || 0}</td><td>{s.GoalsAgainst || 0}</td><td>{s.GoalDifference || 0}</td>
                  <td><strong>{s.Points || 0}</strong></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Section>
      <Section n={2} title="How Positions Are Decided">
        <ol className="gz-list">
          <li>Win = 3 points, Draw = 1 point, Loss = 0 points.</li>
          <li>Ties on points are separated by goal difference, then goals scored.</li>
          <li>Only results confirmed by both players, or by the administration, are counted.</li>
        </ol>
      </Section>
    </>
  );

  const finalBody = () => (
    <>
      {c.WinnerName ? (
        <Section n={1} title="Champion">
          <KV rows={[['Champion', <strong key="w">{c.WinnerName}</strong>], ['Prize Awarded', prize], ['Competition', c.Name]]} />
        </Section>
      ) : (
        <>
          <Notice>
            <strong>Status:</strong> This competition has not finished, so there is no champion to announce yet.
          </Notice>
          <Section n={1} title="How Final Results Are Published">
            <ol className="gz-list">
              <li>When the last match is confirmed, the administration publishes the champion here.</li>
              <li>The winner is contacted on the WhatsApp number in their profile to claim the prize of {prize}.</li>
              <li>Final tables and brackets are then closed and kept as the official record.</li>
            </ol>
          </Section>
        </>
      )}
    </>
  );

  const body = { rules: rulesBody, registered: registeredBody, bracket: bracketBody, fixtures: fixturesBody, standings: standingsBody, final: finalBody }[kind]();

  return createPortal(
    <div className="gz-overlay fixed inset-0 z-[100] bg-black/80 overflow-y-auto" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="gz-toolbar sticky top-0 z-10 flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 bg-[#0c120e] border-b border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="text-xs font-bold uppercase tracking-wider text-gray-300 truncate">{meta.title}</div>
        <div className="flex items-center gap-2">
          <ShareButton title={`${c.Name} — ${meta.title}`} text={`${c.Name}: ${meta.title}.`} url={shareUrl} />
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200 cursor-pointer">
            <Printer className="w-3.5 h-3.5 text-amber-400" /> <span className="hidden sm:inline">Print / PDF</span>
          </button>
          {external && external.startsWith('http') && (
            <a href={external} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200">
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" /> Google Doc
            </a>
          )}
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="document-page-wrapper gz-paper-wrap" onClick={(e) => e.stopPropagation()}>
        <article className="document gz-paper" id="gazette-print-root">
          <header className="gz-masthead">
            <img
              src={crest}
              alt="Chuka University crest"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (!e.currentTarget.src.endsWith('chuka-crest.png')) e.currentTarget.src = localCrest;
              }}
            />
            <div className="gz-masthead-title">
              <div className="gz-univ">Chuka University</div>
              <h1>eFootball Esports Gazette</h1>
              <div className="gz-tagline">Official Information of the Chuka eFootball Community</div>
            </div>
            <div className="gz-notice-box">
              <div>Gazette Notice</div>
              <strong>{notice}</strong>
            </div>
          </header>
          <div className="gz-double-rule" />
          <div className="gz-dateline">
            <span>Chuka, Kenya</span>
            <span>{formatLongDate(new Date().toISOString())}</span>
            <span>Vol. {year - 2025} · Published by Authority</span>
          </div>
          <div className="gz-double-rule" />

          <h2 className="gz-doc-title">{meta.title}</h2>
          <p className="gz-doc-sub">{c.Name}</p>

          {body}

          <footer className="gz-footer">
            <div className="gz-sign">
              <div className="gz-sign-line" />
              <div>Esports Coordinator</div>
              <div className="gz-small">Chuka eFootball Community</div>
            </div>
            <div className="gz-seal">OFFICIAL<br />SEAL</div>
            <div className="gz-sign">
              <div className="gz-sign-line" />
              <div>Competition Administrator</div>
              <div className="gz-small">Help Desk: Sidney Wafula (0180752220)</div>
            </div>
          </footer>
          <p className="gz-fineprint">Notice {notice} · Issued {formatLongDate(new Date().toISOString())} · Fair Play Standard · Chuka eFootball</p>
        </article>
      </div>
    </div>,
    document.body
  );
};
