import React from 'react';
import { MatchRule } from '../../types';
import { INITIAL_MATCH_RULES } from '../../data/matchRulesData';
import { CHUKA_CREST_FALLBACK, CHUKA_CREST_URL } from '../common/ChukaOfficialCrest';
import { EFOOTBALL_LOGO_URL } from '../common/EFootballLogo';

interface OfficialMatchRulesDocumentProps {
  rules?: MatchRule[];
  className?: string;
}

/**
 * Master CHUKA official-document design. All official competition documents
 * use the same Gazette visual language: crest, eFootball mark, masthead,
 * double rule, numbered sections, tables and official footer.
 */
export const OfficialMatchRulesDocument: React.FC<OfficialMatchRulesDocumentProps> = ({
  rules = INITIAL_MATCH_RULES,
  className = '',
}) => {
  const allRules = rules?.length ? rules : INITIAL_MATCH_RULES;
  const knockout = allRules.filter(r => r.Competition === 'Knockout' && r.Active !== false);
  const league = allRules.filter(r => r.Competition === 'League' && r.Active !== false);

  const renderTable = (title: string, rows: MatchRule[], fallback: string) => (
    <section className="gz-section">
      <h3 className="gz-section-title">{title}</h3>
      <table className="doc-table">
        <thead><tr><th>Rule ID</th><th>Title</th><th>Official Requirement</th></tr></thead>
        <tbody>
          {rows.length ? rows.map((r, i) => (
            <tr key={r.RuleID || `${title}-${i}`}>
              <td>{r.RuleID || `RULE-${i + 1}`}</td>
              <td>{r.RuleTitle}</td>
              <td>{r.RuleContent}</td>
            </tr>
          )) : <tr><td>{fallback.split('|')[0]}</td><td>{fallback.split('|')[1]}</td><td>{fallback.split('|')[2]}</td></tr>}
        </tbody>
      </table>
    </section>
  );

  return (
    <div className={`document-page-wrapper ${className}`}>
      <article className="gz-paper document" id="official-match-rules-document">
        <header className="gz-masthead">
          <div><img src={CHUKA_CREST_URL} alt="Chuka University Crest" referrerPolicy="no-referrer" onError={e => { e.currentTarget.src = CHUKA_CREST_FALLBACK; }} /></div>
          <div className="gz-masthead-title">
            <div className="gz-univ">CHUKA UNIVERSITY • OFFICIAL ESPORTS</div>
            <h1>CHUKA eFOOTBALL</h1>
            <div className="gz-tagline">Official University eFootball Esports Hub</div>
          </div>
          <div><img src={EFOOTBALL_LOGO_URL} alt="eFootball" referrerPolicy="no-referrer" /></div>
        </header>
        <div className="gz-double-rule" />
        <div className="gz-dateline"><span>OFFICIAL MATCH RULES</span><span>FAIR PLAY STANDARD</span></div>
        <h2 className="gz-doc-title">Official Match Rules &amp; Regulations</h2>
        <p className="gz-doc-sub">Applicable to sanctioned CHUKA eFootball Knockout and League competitions.</p>

        {renderTable('Knockout Rules', knockout, 'RULE-KO-01|Tournament Format & Brackets|Single-elimination knockout competition. Winners advance to the next round; disputed matches do not advance.')}
        {renderTable('League Rules', league, 'RULE-LG-01|League Format & Points System|Round-robin league format. Win = 3 points, draw = 1 point, loss = 0 points. Goal difference is used as a tiebreaker.')}

        <div className="doc-note"><strong>Official record:</strong> These rules are maintained from the CHUKA eFootball MatchRules source and are applied to competition documents and match administration.</div>
        <footer className="gz-footer">
          <div className="gz-sign"><div className="gz-sign-line" /><div className="gz-small">CHUKA eFootball Competition Administration</div></div>
          <div className="gz-seal">CHUKA<br/>eFOOTBALL<br/>OFFICIAL</div>
          <div className="gz-sign"><div className="gz-sign-line" /><div className="gz-small">Fair Play • Competitive Integrity</div></div>
        </footer>
        <div className="gz-fineprint">Official document • Keep this document with your competition records • CHUKA eFootball</div>
      </article>
    </div>
  );
};
