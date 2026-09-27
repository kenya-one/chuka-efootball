import { MatchRule } from '../types';

export const INITIAL_MATCH_RULES: MatchRule[] = [
  // Knockout Rules
  {
    RuleID: 'RULE-KO-01',
    Competition: 'Knockout',
    RuleTitle: 'Tournament Format & Brackets',
    RuleContent:
      'Single elimination knockout brackets. The winner of each match advances to the subsequent round while the loser is eliminated. All brackets are synchronized via Google Sheets.',
    Active: true,
    UpdatedAt: new Date().toISOString(),
  },
  {
    RuleID: 'RULE-KO-02',
    Competition: 'Knockout',
    RuleTitle: 'Match Scheduling & Deadlines',
    RuleContent:
      'Players must schedule and complete their designated knockout fixture before the published round deadline. Failure to communicate may result in a forfeit walkover.',
    Active: true,
    UpdatedAt: new Date().toISOString(),
  },
  {
    RuleID: 'RULE-KO-03',
    Competition: 'Knockout',
    RuleTitle: 'Extra Time & Penalties',
    RuleContent:
      'If scores are level at 90 minutes in knockout fixtures, extra time and penalty shootouts must be played immediately to determine the advancing player.',
    Active: true,
    UpdatedAt: new Date().toISOString(),
  },
  {
    RuleID: 'RULE-KO-04',
    Competition: 'Knockout',
    RuleTitle: 'Screenshot & Result Verification',
    RuleContent:
      'Both players must take a clear end-game screenshot displaying final score, player gamertags, and match statistics. The winner submits the result; the opponent must confirm.',
    Active: true,
    UpdatedAt: new Date().toISOString(),
  },

  // League Rules
  {
    RuleID: 'RULE-LG-01',
    Competition: 'League',
    RuleTitle: 'League Format & Points System',
    RuleContent:
      'Round-robin league format. Three points for a win, one point for a draw, and zero points for a loss. Goal difference is used as the primary tiebreaker.',
    Active: true,
    UpdatedAt: new Date().toISOString(),
  },
  {
    RuleID: 'RULE-LG-02',
    Competition: 'League',
    RuleTitle: 'Match Scheduling & Deadlines',
    RuleContent:
      'All league fixtures must be completed within the designated matchweek window. Players are responsible for coordinating and reporting results before the deadline.',
    Active: true,
    UpdatedAt: new Date().toISOString(),
  },
  {
    RuleID: 'RULE-LG-03',
    Competition: 'League',
    RuleTitle: 'Draws & Points Allocation',
    RuleContent:
      'League matches can end in a draw. Both players receive one point each. No extra time or penalties are played in league fixtures.',
    Active: true,
    UpdatedAt: new Date().toISOString(),
  },
  {
    RuleID: 'RULE-LG-04',
    Competition: 'League',
    RuleTitle: 'Screenshot & Result Verification',
    RuleContent:
      'Both players must take a clear end-game screenshot displaying final score, player gamertags, and match statistics. The winner submits the result; the opponent must confirm.',
    Active: true,
    UpdatedAt: new Date().toISOString(),
  },
];

