/**
 * Central Division Configuration for Chuka eFootball
 * Extensible for future tournament divisions.
 */
export const DEFAULT_DIVISION = 'OPEN';

export interface DivisionDefinition {
  id: string;
  name: string;
  description: string;
  badgeColor: string;
}

export const AVAILABLE_DIVISIONS: DivisionDefinition[] = [
  {
    id: 'OPEN',
    name: 'OPEN',
    description: 'Open competition division for all registered eFootball players',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'Division 1',
    name: 'Division 1',
    description: 'Elite tier championship division',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  {
    id: 'Division 2',
    name: 'Division 2',
    description: 'Competitive second tier league',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  {
    id: 'Division 3',
    name: 'Division 3',
    description: 'Challenger third tier league',
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
];

export function getDivisionBadgeColor(divisionId?: string): string {
  const div = AVAILABLE_DIVISIONS.find(
    (d) => d.id.toLowerCase() === (divisionId || DEFAULT_DIVISION).toLowerCase()
  );
  return div ? div.badgeColor : 'bg-gray-500/15 text-gray-400 border-gray-500/30';
}
