import React from 'react';
import { MatchRule } from '../../types';
import { INITIAL_MATCH_RULES } from '../../data/matchRulesData';
import { CHUKA_CREST_FALLBACK, CHUKA_CREST_URL } from '../common/ChukaOfficialCrest';

export const EFOOTBALL_LOGO_URL =
  'https://images.seeklogo.com/logo-png/45/1/efootball-logo-png_seeklogo-451310.png';

interface OfficialMatchRulesDocumentProps {
  rules?: MatchRule[];
  className?: string;
}

export const OfficialMatchRulesDocument: React.FC<OfficialMatchRulesDocumentProps> = ({
  rules = INITIAL_MATCH_RULES,
  className = '',
}) => {
  const allRules = rules && rules.length > 0 ? rules : INITIAL_MATCH_RULES;

  const knockoutRules = allRules.filter(
    (r) => r.Competition === 'Knockout' && r.Active !== false
  );
  const leagueRules = allRules.filter(
    (r) => r.Competition === 'League' && r.Active !== false
  );

  return (
    <div className={`document ${className}`} id="official-match-rules-document">
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

      {/* ===== RULES ===== */}
      <h2 className="section-title">Official Match Rules</h2>

      {/* KNOCKOUT RULES */}
      <h3 className="subsection-title">🏆 Knockout Rules</h3>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Rule ID</th>
            <th>Title</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {knockoutRules.length > 0 ? (
            knockoutRules.map((rule, idx) => (
              <tr key={rule.RuleID || `ko-${idx}`}>
                <td>{rule.RuleID || `RULE-KO-0${idx + 1}`}</td>
                <td>{rule.RuleTitle}</td>
                <td>{rule.RuleContent}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td>RULE-KO-01</td>
              <td>Tournament Format &amp; Brackets</td>
              <td>
                Single elimination knockout brackets. The winner of each match advances to the
                subsequent round while the loser is eliminated. All brackets are synchronized via
                Google Sheets.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* LEAGUE RULES */}
      <h3 className="subsection-title">🥇 League Rules</h3>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Rule ID</th>
            <th>Title</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {leagueRules.length > 0 ? (
            leagueRules.map((rule, idx) => (
              <tr key={rule.RuleID || `lg-${idx}`}>
                <td>{rule.RuleID || `RULE-LG-0${idx + 1}`}</td>
                <td>{rule.RuleTitle}</td>
                <td>{rule.RuleContent}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td>RULE-LG-01</td>
              <td>League Format &amp; Points System</td>
              <td>
                Round-robin league format. Three points for a win, one point for a draw, and zero
                points for a loss. Goal difference is used as the primary tiebreaker.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* NOTE */}
      <p className="doc-note">
        <strong>Google Sheets Live Rules:</strong> These regulations are linked to the MatchRules sheet.
        Updates made by tournament administrators in Google Sheets will automatically reflect here.
      </p>

      {/* ===== FOOTER ===== */}
      <footer className="doc-footer">
        <div className="help-desk">
          Help Desk:{' '}
          <a href="tel:0180752220" id="rules-helpdesk-link">
            Sidney Wafula (0180752220)
          </a>
        </div>
        <div className="fair-play">Fair Play Standard • Chuka eFootball</div>
      </footer>
    </div>
  );
};
