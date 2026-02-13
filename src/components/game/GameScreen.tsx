'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';
import { useSpotifyToken } from '@/hooks/useSpotifyToken';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import { useCountdown } from '@/hooks/useCountdown';
import type { RoundGuess } from '@/types/game';

import TurnBanner from './TurnBanner';
import CountdownTimer from './CountdownTimer';
import Equalizer from './Equalizer';
import GuessForm from './GuessForm';
import Timeline from './Timeline';
import RoundResult from './RoundResult';
import ScoreBoard from './ScoreBoard';
import GameOver from '@/components/results/GameOver';

export default function GameScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const { accessToken } = useSpotifyToken();
  const { playTrack, pause, isReady, isSearchingDevice, noDeviceFound, deviceName, retryDeviceSearch } = useSpotifyPlayer(accessToken);
  const hasStartedRef = useRef(false);
  const roundStartedRef = useRef(false);

  const currentTeam = state.teams[state.currentTeamIndex];

  // Listening timer
  const listeningTimer = useCountdown(
    state.guessTimeSec,
    useCallback(() => {
      pause();
      dispatch({ type: 'LISTENING_COMPLETE' });
    }, [pause, dispatch])
  );

  // Guessing timer
  const guessingTimer = useCountdown(
    state.guessTimeSec,
    useCallback(() => {
      dispatch({
        type: 'SUBMIT_GUESS',
        payload: { artistGuess: '', songGuess: '', yearGuess: 2000 },
      });
    }, [dispatch])
  );

  // Redirect to setup if no game state
  useEffect(() => {
    if (state.phase === 'setup' && state.trackPool.length === 0) {
      router.push('/');
    }
  }, [state.phase, state.trackPool.length, router]);

  // Auto-start first round when game is initialized and player is ready
  useEffect(() => {
    if (
      state.phase === 'setup' &&
      state.trackPool.length > 0 &&
      isReady &&
      !hasStartedRef.current
    ) {
      hasStartedRef.current = true;
      dispatch({ type: 'START_ROUND' });
    }
  }, [state.phase, state.trackPool.length, isReady, dispatch]);

  // Play track when entering listening phase
  useEffect(() => {
    if (state.phase === 'listening' && state.currentTrack && !roundStartedRef.current) {
      roundStartedRef.current = true;
      playTrack(state.currentTrack.uri);
      listeningTimer.start();
    }
    if (state.phase !== 'listening') {
      roundStartedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.currentTrack]);

  // Start guessing timer when entering guessing phase
  const guessingStartedRef = useRef(false);
  useEffect(() => {
    if (state.phase === 'guessing' && !guessingStartedRef.current) {
      guessingStartedRef.current = true;
      guessingTimer.start();
    }
    if (state.phase !== 'guessing') {
      guessingStartedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // Auto-place in timeline if timeline is empty (first song)
  useEffect(() => {
    if (state.phase === 'placing' && currentTeam.timeline.length === 0) {
      dispatch({ type: 'PLACE_IN_TIMELINE', payload: { position: 0 } });
    }
  }, [state.phase, currentTeam.timeline.length, dispatch]);

  const handleGuessSubmit = useCallback(
    (guess: RoundGuess) => {
      guessingTimer.stop();
      dispatch({ type: 'SUBMIT_GUESS', payload: guess });
    },
    [dispatch, guessingTimer]
  );

  const handlePlaceInTimeline = useCallback(
    (position: number) => {
      dispatch({ type: 'PLACE_IN_TIMELINE', payload: { position } });
    },
    [dispatch]
  );

  const handleSkipTimeline = useCallback(() => {
    dispatch({ type: 'SKIP_TIMELINE' });
  }, [dispatch]);

  const handleSkipListening = useCallback(() => {
    listeningTimer.stop();
    pause();
    dispatch({ type: 'LISTENING_COMPLETE' });
  }, [dispatch, pause, listeningTimer]);

  const handleNextTurn = useCallback(() => {
    dispatch({ type: 'NEXT_TURN' });
    // After next turn sets up, start the round
    setTimeout(() => {
      dispatch({ type: 'START_ROUND' });
    }, 100);
  }, [dispatch]);

  const handlePlayAgain = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
    hasStartedRef.current = false;
    router.push('/');
  }, [dispatch, router]);

  // Waiting for player to be ready
  if (!isReady && state.phase === 'setup' && state.trackPool.length > 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          {isSearchingDevice && (
            <>
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-text-secondary">
                Buscando dispositivo de Spotify...
              </p>
              <p className="text-text-secondary text-sm opacity-70">
                Asegurate de tener Spotify abierto en tu computadora, celular o navegador
              </p>
            </>
          )}
          {noDeviceFound && (
            <>
              <div className="text-4xl mb-2">🎵</div>
              <p className="text-text-primary font-semibold text-lg">
                No se encontró ningún dispositivo de Spotify
              </p>
              <p className="text-text-secondary text-sm">
                Para jugar, necesitás tener Spotify abierto en algún dispositivo:
              </p>
              <ul className="text-text-secondary text-sm text-left space-y-2 mt-2">
                <li>🖥️ App de escritorio de Spotify</li>
                <li>📱 App de Spotify en el celular</li>
                <li>🌐 <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Spotify Web Player</a></li>
              </ul>
              <p className="text-text-secondary text-xs mt-2 opacity-70">
                Abrí Spotify, reproducí una canción cualquiera y después hacé click en reintentar.
              </p>
              <button
                onClick={retryDeviceSearch}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                🔄 Reintentar
              </button>
            </>
          )}
          {!isSearchingDevice && !noDeviceFound && (
            <>
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-text-secondary">
                Conectando con Spotify...
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Game Over overlay */}
      {state.phase === 'gameover' && state.winner && (
        <GameOver
          winner={state.winner}
          teams={state.teams}
          onPlayAgain={handlePlayAgain}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">
            <span className="text-primary">Shazam</span>{' '}
            <span className="text-secondary">Humano</span>
          </h1>
          {deviceName && (
            <p className="text-xs text-text-secondary mt-1 opacity-60">
              🔊 {deviceName}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main game area */}
          <div className="lg:col-span-3 space-y-6">
            <TurnBanner
              teamName={currentTeam.name}
              teamIndex={state.currentTeamIndex}
              roundNumber={state.roundNumber}
            />

            {/* Listening phase */}
            {state.phase === 'listening' && (
              <div className="flex flex-col items-center gap-6 py-8">
                <Equalizer />
                <p className="text-text-secondary text-lg">
                  Escuchando...
                </p>
                <CountdownTimer
                  timeLeft={listeningTimer.timeLeft}
                  totalTime={state.guessTimeSec}
                  label="Tiempo de escucha"
                />
                <button
                  onClick={handleSkipListening}
                  className="mt-2 px-4 py-2 text-sm text-text-secondary hover:text-accent border border-surface-light hover:border-accent rounded-lg transition-colors"
                >
                  ⏭ Ya la tengo, adivinar
                </button>
              </div>
            )}

            {/* Guessing phase */}
            {state.phase === 'guessing' && (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <p className="text-text-secondary text-lg mb-4">
                    ¡Hora de adivinar!
                  </p>
                  <CountdownTimer
                    timeLeft={guessingTimer.timeLeft}
                    totalTime={state.guessTimeSec}
                    label="Tiempo para adivinar"
                  />
                </div>
                <GuessForm onSubmit={handleGuessSubmit} />
              </div>
            )}

            {/* Placing phase */}
            {state.phase === 'placing' && currentTeam.timeline.length > 0 && (
              <div className="py-4">
                <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">
                  Ubica la cancion en tu timeline
                </h3>
                <Timeline
                  timeline={currentTeam.timeline}
                  newTrack={state.currentTrack}
                  onPlace={handlePlaceInTimeline}
                  onSkip={handleSkipTimeline}
                  isPlacing={true}
                />
              </div>
            )}

            {/* Result phase */}
            {state.phase === 'result' &&
              state.currentRoundResult &&
              state.currentTrack && (
                <RoundResult
                  result={state.currentRoundResult}
                  track={state.currentTrack}
                  onNext={handleNextTurn}
                />
              )}

            {/* Current team's timeline (display mode) */}
            {(state.phase === 'listening' || state.phase === 'guessing') && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-text-secondary mb-2">
                  Timeline de {currentTeam.name}
                </h3>
                <Timeline
                  timeline={currentTeam.timeline}
                  newTrack={null}
                  onPlace={() => {}}
                  onSkip={() => {}}
                  isPlacing={false}
                />
              </div>
            )}
          </div>

          {/* Sidebar: Scoreboard */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ScoreBoard
                teams={state.teams}
                currentTeamIndex={state.currentTeamIndex}
                targetScore={state.targetScore}
                roundNumber={state.roundNumber}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
