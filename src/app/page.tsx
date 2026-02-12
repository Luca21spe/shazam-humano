'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSpotifyToken } from '@/hooks/useSpotifyToken';
import { useGame } from '@/context/GameContext';
import { fetchPlaylistTracks } from '@/lib/spotify';
import { generateId } from '@/lib/utils';
import SpotifyLoginButton from '@/components/setup/SpotifyLoginButton';
import TeamForm from '@/components/setup/TeamForm';
import PlaylistSelector from '@/components/setup/PlaylistSelector';
import GameSettings from '@/components/setup/GameSettings';
import type { Team, SpotifyTrack } from '@/types/game';

export default function SetupPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useSpotifyToken();
  const { dispatch } = useGame();

  const [teams, setTeams] = useState<[Team, Team]>([
    {
      id: generateId(),
      name: 'Equipo 1',
      members: [{ id: generateId(), name: '' }],
      score: 0,
      timeline: [],
    },
    {
      id: generateId(),
      name: 'Equipo 2',
      members: [{ id: generateId(), name: '' }],
      score: 0,
      timeline: [],
    },
  ]);

  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
  const [targetScore, setTargetScore] = useState(10);
  const [guessTimeSec, setGuessTimeSec] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePlaylist = useCallback((id: string) => {
    setSelectedPlaylists((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const updateTeam = useCallback((index: number, team: Team) => {
    setTeams((prev) => {
      const next = [...prev] as [Team, Team];
      next[index] = team;
      return next;
    });
  }, []);

  const canStart =
    isAuthenticated &&
    teams[0].name.trim() &&
    teams[1].name.trim() &&
    teams[0].members.some((m) => m.name.trim()) &&
    teams[1].members.some((m) => m.name.trim()) &&
    selectedPlaylists.length > 0;

  const startGame = async () => {
    if (!accessToken || !canStart) return;
    setIsLoading(true);
    setError(null);

    try {
      const allTracks: SpotifyTrack[] = [];
      for (const playlistId of selectedPlaylists) {
        const tracks = await fetchPlaylistTracks(playlistId, accessToken);
        allTracks.push(...tracks);
      }

      // Deduplicate
      const seen = new Set<string>();
      const uniqueTracks = allTracks.filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });

      if (uniqueTracks.length < 5) {
        setError('Las playlists seleccionadas no tienen suficientes canciones.');
        setIsLoading(false);
        return;
      }

      // Clean up team members (remove empty names)
      const cleanTeams: [Team, Team] = [
        {
          ...teams[0],
          members: teams[0].members.filter((m) => m.name.trim()),
          score: 0,
          timeline: [],
        },
        {
          ...teams[1],
          members: teams[1].members.filter((m) => m.name.trim()),
          score: 0,
          timeline: [],
        },
      ];

      dispatch({
        type: 'INITIALIZE_GAME',
        payload: {
          teams: cleanTeams,
          targetScore,
          guessTimeSec,
          trackPool: uniqueTracks,
        },
      });

      router.push('/game');
    } catch (err) {
      console.error('Failed to start game:', err);
      setError('Error al cargar las canciones. Intentalo de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl sm:text-6xl font-bold mb-3">
            <span className="text-primary">Shazam</span>{' '}
            <span className="text-secondary">Humano</span>
          </h1>
          <p className="text-text-secondary text-lg">
            El juego musical donde vos sos el Shazam
          </p>
        </div>

        {/* Step 1: Spotify */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-bold">
              1
            </span>
            Conecta tu Spotify
          </h2>
          <SpotifyLoginButton isAuthenticated={isAuthenticated} />
        </section>

        {/* Step 2: Teams */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-bold">
              2
            </span>
            Arma los equipos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TeamForm
              team={teams[0]}
              teamIndex={0}
              onUpdate={(t) => updateTeam(0, t)}
            />
            <TeamForm
              team={teams[1]}
              teamIndex={1}
              onUpdate={(t) => updateTeam(1, t)}
            />
          </div>
        </section>

        {/* Step 3: Playlists */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-bold">
              3
            </span>
            Elegi las playlists
          </h2>
          <PlaylistSelector
            selectedIds={selectedPlaylists}
            onToggle={togglePlaylist}
          />
        </section>

        {/* Step 4: Settings */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-bold">
              4
            </span>
            Configura el juego
          </h2>
          <GameSettings
            targetScore={targetScore}
            guessTimeSec={guessTimeSec}
            onTargetScoreChange={setTargetScore}
            onGuessTimeChange={setGuessTimeSec}
          />
        </section>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl bg-accent/10 border border-accent/30 text-accent px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={startGame}
          disabled={!canStart || isLoading}
          className="w-full rounded-2xl bg-primary hover:bg-primary/90 disabled:bg-surface-light disabled:text-text-secondary text-white font-bold text-xl py-4 transition-colors pulse-glow disabled:animate-none"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <svg
                className="animate-spin h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Cargando canciones...
            </span>
          ) : (
            'Empezar Juego'
          )}
        </button>
      </div>
    </main>
  );
}
