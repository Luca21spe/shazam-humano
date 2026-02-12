'use client';

import { useState } from 'react';
import type { RoundGuess } from '@/types/game';

interface GuessFormProps {
  onSubmit: (guess: RoundGuess) => void;
  disabled?: boolean;
}

export default function GuessForm({ onSubmit, disabled }: GuessFormProps) {
  const [artistGuess, setArtistGuess] = useState('');
  const [songGuess, setSongGuess] = useState('');
  const [yearGuess, setYearGuess] = useState(2000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ artistGuess, songGuess, yearGuess });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto">
      <div>
        <label className="block text-sm text-text-secondary mb-1">
          Artista
        </label>
        <input
          type="text"
          value={artistGuess}
          onChange={(e) => setArtistGuess(e.target.value)}
          className="w-full bg-surface-light rounded-xl px-4 py-3 text-text-primary outline-none border border-transparent focus:border-primary/50 transition-colors"
          placeholder="Nombre del artista..."
          autoComplete="off"
          disabled={disabled}
        />
      </div>

      <div>
        <label className="block text-sm text-text-secondary mb-1">
          Cancion
        </label>
        <input
          type="text"
          value={songGuess}
          onChange={(e) => setSongGuess(e.target.value)}
          className="w-full bg-surface-light rounded-xl px-4 py-3 text-text-primary outline-none border border-transparent focus:border-primary/50 transition-colors"
          placeholder="Nombre de la cancion..."
          autoComplete="off"
          disabled={disabled}
        />
      </div>

      <div>
        <label className="block text-sm text-text-secondary mb-1">
          Ano
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setYearGuess((y) => Math.max(1950, y - 1))}
            className="w-10 h-10 rounded-lg bg-surface-light border border-surface-light hover:border-primary/30 text-text-primary text-xl flex items-center justify-center transition-colors"
            disabled={disabled}
          >
            -
          </button>
          <input
            type="number"
            value={yearGuess}
            onChange={(e) => setYearGuess(parseInt(e.target.value, 10) || 2000)}
            className="flex-1 bg-surface-light rounded-xl px-4 py-3 text-text-primary text-center text-xl font-bold outline-none border border-transparent focus:border-primary/50 transition-colors"
            min={1950}
            max={new Date().getFullYear()}
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() =>
              setYearGuess((y) => Math.min(new Date().getFullYear(), y + 1))
            }
            className="w-10 h-10 rounded-lg bg-surface-light border border-surface-light hover:border-primary/30 text-text-primary text-xl flex items-center justify-center transition-colors"
            disabled={disabled}
          >
            +
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-xl bg-primary hover:bg-primary/90 disabled:bg-surface-light disabled:text-text-secondary text-white font-semibold py-3 transition-colors"
      >
        Enviar respuesta
      </button>
    </form>
  );
}
