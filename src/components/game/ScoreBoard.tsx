'use client';

import type { Team } from '@/types/game';

interface ScoreBoardProps {
  teams: [Team, Team];
  currentTeamIndex: 0 | 1;
  targetScore: number;
  roundNumber: number;
}

export default function ScoreBoard({
  teams,
  currentTeamIndex,
  targetScore,
  roundNumber,
}: ScoreBoardProps) {
  return (
    <div className="rounded-2xl border border-surface-light bg-surface p-4 space-y-4">
      <div className="text-center text-sm text-text-secondary">
        Ronda {roundNumber} &middot; Meta: {targetScore} pts
      </div>

      {teams.map((team, i) => {
        const isActive = i === currentTeamIndex;
        const color = i === 0 ? 'team-1' : 'team-2';
        const progress = Math.min(1, team.score / targetScore) * 100;

        return (
          <div
            key={team.id}
            className={`rounded-xl p-3 border transition-colors ${
              isActive
                ? `border-${color}/50 bg-${color}/5`
                : 'border-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isActive && (
                  <div className={`w-2 h-2 rounded-full bg-${color} animate-pulse`} />
                )}
                <span className={`font-semibold text-${color}`}>
                  {team.name}
                </span>
              </div>
              <span className="text-xl font-bold text-text-primary">
                {team.score}
              </span>
            </div>
            <div className="w-full h-2 bg-surface-light rounded-full overflow-hidden">
              <div
                className={`h-full bg-${color} rounded-full transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-text-secondary">
              {team.members.map((m) => m.name).join(', ')}
            </div>
          </div>
        );
      })}
    </div>
  );
}
