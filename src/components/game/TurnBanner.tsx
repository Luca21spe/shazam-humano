'use client';

interface TurnBannerProps {
  teamName: string;
  teamIndex: 0 | 1;
  roundNumber: number;
}

export default function TurnBanner({
  teamName,
  teamIndex,
  roundNumber,
}: TurnBannerProps) {
  const color = teamIndex === 0 ? 'text-team-1' : 'text-team-2';
  const bg = teamIndex === 0 ? 'bg-team-1/10 border-team-1/30' : 'bg-team-2/10 border-team-2/30';

  return (
    <div className={`rounded-xl border ${bg} px-6 py-3 text-center`}>
      <div className="text-xs text-text-secondary mb-1">
        Ronda {roundNumber}
      </div>
      <div className={`text-2xl font-bold ${color}`}>
        Turno de {teamName}
      </div>
    </div>
  );
}
