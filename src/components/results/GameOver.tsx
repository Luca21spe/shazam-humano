'use client';

import { useEffect, useState } from 'react';
import type { Team } from '@/types/game';

interface GameOverProps {
  winner: Team;
  teams: [Team, Team];
  onPlayAgain: () => void;
}

const CONFETTI_COLORS = ['#6c63ff', '#00d4aa', '#ffd700', '#ff6b6b', '#ff9f43'];

export default function GameOver({ winner, teams, onPlayAgain }: GameOverProps) {
  const [confettiPieces, setConfettiPieces] = useState<
    { id: number; left: number; color: string; delay: number; size: number }[]
  >([]);

  useEffect(() => {
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 2,
      size: 6 + Math.random() * 10,
    }));
    setConfettiPieces(pieces);
  }, []);

  const winnerIndex = teams.findIndex((t) => t.id === winner.id);
  const winnerColor = winnerIndex === 0 ? 'text-team-1' : 'text-team-2';

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4">
      {/* Confetti */}
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece rounded-sm"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            width: piece.size,
            height: piece.size,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}

      <div className="max-w-lg w-full text-center space-y-8 relative z-10">
        <div className="text-6xl mb-4">🏆</div>

        <div>
          <div className="text-text-secondary text-lg mb-2">
            ¡Gano el juego!
          </div>
          <h1 className={`text-5xl font-bold ${winnerColor}`}>
            {winner.name}
          </h1>
        </div>

        {/* Final scores */}
        <div className="grid grid-cols-2 gap-4">
          {teams.map((team, i) => {
            const isWinner = team.id === winner.id;
            const color = i === 0 ? 'team-1' : 'team-2';
            return (
              <div
                key={team.id}
                className={`rounded-xl border p-4 ${
                  isWinner
                    ? `border-${color}/50 bg-${color}/10`
                    : 'border-surface-light bg-surface'
                }`}
              >
                <div className={`font-semibold text-${color} mb-1`}>
                  {team.name}
                </div>
                <div className="text-3xl font-bold text-text-primary">
                  {team.score}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {team.timeline.length} canciones en timeline
                </div>
              </div>
            );
          })}
        </div>

        {/* Timelines */}
        {teams.map((team, i) => (
          <div key={team.id}>
            <h3 className={`text-sm font-semibold text-${i === 0 ? 'team-1' : 'team-2'} mb-2`}>
              Timeline de {team.name}
            </h3>
            {team.timeline.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {team.timeline.map((song) => (
                  <div
                    key={song.trackId}
                    className="text-xs bg-surface rounded-lg px-2 py-1 border border-surface-light"
                  >
                    {song.name} ({song.actualYear})
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-text-secondary">Vacia</div>
            )}
          </div>
        ))}

        <button
          onClick={onPlayAgain}
          className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xl py-4 transition-colors"
        >
          Jugar de nuevo
        </button>
      </div>
    </div>
  );
}
