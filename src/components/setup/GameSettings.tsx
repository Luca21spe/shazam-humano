'use client';

interface GameSettingsProps {
  targetScore: number;
  guessTimeSec: number;
  onTargetScoreChange: (value: number) => void;
  onGuessTimeChange: (value: number) => void;
}

export default function GameSettings({
  targetScore,
  guessTimeSec,
  onTargetScoreChange,
  onGuessTimeChange,
}: GameSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="rounded-xl border border-surface-light bg-surface p-5">
          <label className="block text-sm font-medium text-text-secondary mb-3">
            Puntaje para ganar
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={targetScore}
              onChange={(e) => onTargetScoreChange(parseInt(e.target.value, 10))}
              className="flex-1 accent-primary"
            />
            <span className="text-2xl font-bold text-primary min-w-[3ch] text-right">
              {targetScore}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-surface-light bg-surface p-5">
          <label className="block text-sm font-medium text-text-secondary mb-3">
            Tiempo para escuchar y adivinar (segundos)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={15}
              max={120}
              step={5}
              value={guessTimeSec}
              onChange={(e) => onGuessTimeChange(parseInt(e.target.value, 10))}
              className="flex-1 accent-primary"
            />
            <span className="text-2xl font-bold text-primary min-w-[4ch] text-right">
              {guessTimeSec}s
            </span>
          </div>
        </div>
      </div>

      {/* Scoring explanation */}
      <div className="rounded-xl border border-surface-light bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Como se suman los puntos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="rounded-lg bg-primary/10 p-3">
            <div className="text-lg font-bold text-primary">+0.5</div>
            <div className="text-xs text-text-secondary mt-1">Adivinar artista</div>
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <div className="text-lg font-bold text-primary">+0.5</div>
            <div className="text-xs text-text-secondary mt-1">Adivinar cancion</div>
          </div>
          <div className="rounded-lg bg-secondary/10 p-3">
            <div className="text-lg font-bold text-secondary">+1</div>
            <div className="text-xs text-text-secondary mt-1">Ubicar bien en la timeline</div>
          </div>
          <div className="rounded-lg bg-accent/10 p-3">
            <div className="text-lg font-bold text-accent">+0.5</div>
            <div className="text-xs text-text-secondary mt-1">Acertar el ano exacto</div>
          </div>
        </div>
        <p className="text-xs text-text-secondary mt-3 text-center opacity-70">
          Maximo 2.5 puntos por ronda. El primer equipo en llegar a {targetScore} puntos gana.
        </p>
      </div>
    </div>
  );
}
