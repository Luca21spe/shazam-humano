'use client';

import { generateId } from '@/lib/utils';
import type { Team } from '@/types/game';

interface TeamFormProps {
  team: Team;
  teamIndex: number;
  onUpdate: (team: Team) => void;
}

export default function TeamForm({ team, teamIndex, onUpdate }: TeamFormProps) {
  const teamColor = teamIndex === 0 ? 'team-1' : 'team-2';
  const borderColor = teamIndex === 0 ? 'border-team-1/30' : 'border-team-2/30';
  const bgColor = teamIndex === 0 ? 'bg-team-1/5' : 'bg-team-2/5';

  const addMember = () => {
    onUpdate({
      ...team,
      members: [...team.members, { id: generateId(), name: '' }],
    });
  };

  const removeMember = (memberId: string) => {
    onUpdate({
      ...team,
      members: team.members.filter((m) => m.id !== memberId),
    });
  };

  const updateMemberName = (memberId: string, name: string) => {
    onUpdate({
      ...team,
      members: team.members.map((m) =>
        m.id === memberId ? { ...m, name } : m
      ),
    });
  };

  const updateTeamName = (name: string) => {
    onUpdate({ ...team, name });
  };

  return (
    <div
      className={`rounded-2xl border ${borderColor} ${bgColor} p-5 backdrop-blur-sm`}
    >
      <input
        type="text"
        value={team.name}
        onChange={(e) => updateTeamName(e.target.value)}
        className={`w-full bg-transparent text-xl font-bold text-${teamColor} border-b border-${teamColor}/30 pb-2 mb-4 outline-none focus:border-${teamColor} transition-colors`}
        placeholder={`Equipo ${teamIndex + 1}`}
      />

      <div className="space-y-2 mb-4">
        {team.members.map((member) => (
          <div key={member.id} className="flex items-center gap-2">
            <input
              type="text"
              value={member.name}
              onChange={(e) => updateMemberName(member.id, e.target.value)}
              className="flex-1 bg-surface-light rounded-lg px-3 py-2 text-sm text-text-primary outline-none border border-transparent focus:border-primary/30 transition-colors"
              placeholder="Nombre del jugador"
            />
            <button
              onClick={() => removeMember(member.id)}
              className="text-text-secondary hover:text-accent transition-colors p-1"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addMember}
        className="w-full rounded-lg border border-dashed border-text-secondary/30 py-2 text-sm text-text-secondary hover:border-primary/50 hover:text-primary transition-colors"
      >
        + Agregar jugador
      </button>
    </div>
  );
}
