'use client';

import Image from 'next/image';
import type { RoundResult as RoundResultType, SpotifyTrack } from '@/types/game';

interface RoundResultProps {
  result: RoundResultType;
  track: SpotifyTrack;
  onNext: () => void;
}

export default function RoundResult({ result, track, onNext }: RoundResultProps) {
  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Song reveal */}
      <div className="flex items-center gap-4 rounded-xl bg-surface p-4 border border-surface-light">
        {track.albumArt && (
          <Image
            src={track.albumArt}
            alt={track.name}
            width={80}
            height={80}
            className="rounded-lg"
          />
        )}
        <div>
          <div className="font-bold text-lg text-text-primary">{track.name}</div>
          <div className="text-text-secondary">{track.artist}</div>
          <div className="text-text-secondary text-sm">{track.releaseYear}</div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="space-y-3">
        <ScoreLine
          label="Artista"
          guess={result.guess.artistGuess || '(vacio)'}
          correct={result.artistPoints > 0}
          points={result.artistPoints}
        />
        <ScoreLine
          label="Cancion"
          guess={result.guess.songGuess || '(vacio)'}
          correct={result.songPoints > 0}
          points={result.songPoints}
        />
        <ScoreLine
          label="Ubicacion en timeline"
          guess={result.timelinePlacementCorrect ? 'Correcta' : 'Incorrecta'}
          correct={result.timelinePlacementCorrect}
          points={result.yearRangePoints}
        />
        {result.yearExactBonus > 0 && (
          <ScoreLine
            label="Ano exacto"
            guess={result.guess.yearGuess.toString()}
            correct={true}
            points={result.yearExactBonus}
            isBonus
          />
        )}
      </div>

      {/* Total */}
      <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 text-center">
        <div className="text-sm text-text-secondary">Puntos esta ronda</div>
        <div className="text-4xl font-bold text-primary">
          +{result.totalPoints}
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold py-3 transition-colors"
      >
        Siguiente turno
      </button>
    </div>
  );
}

function ScoreLine({
  label,
  guess,
  correct,
  points,
  isBonus,
}: {
  label: string;
  guess: string;
  correct: boolean;
  points: number;
  isBonus?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3 border border-surface-light">
      <div className="flex items-center gap-3">
        <span
          className={`text-lg ${correct ? 'text-secondary' : 'text-accent'}`}
        >
          {correct ? '✓' : '✗'}
        </span>
        <div>
          <div className="text-sm text-text-secondary">{label}</div>
          <div className="text-text-primary text-sm">{guess}</div>
        </div>
      </div>
      <div
        className={`font-bold text-lg ${isBonus ? 'text-gold' : correct ? 'text-secondary' : 'text-text-secondary'}`}
      >
        {points > 0 ? `+${points}` : '0'}
      </div>
    </div>
  );
}
