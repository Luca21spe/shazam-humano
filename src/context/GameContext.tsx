'use client';

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from 'react';
import type {
  GameState,
  GameAction,
  Team,
  TimelineSong,
} from '@/types/game';
import { calculateRoundScore } from '@/lib/scoring';
import { validateTimelinePlacement, insertIntoTimeline } from '@/lib/timeline';
import { shuffleArray } from '@/lib/utils';

const initialState: GameState = {
  phase: 'setup',
  teams: [
    { id: '1', name: 'Equipo 1', members: [], score: 0, timeline: [] },
    { id: '2', name: 'Equipo 2', members: [], score: 0, timeline: [] },
  ],
  currentTeamIndex: 0,
  targetScore: 10,
  guessTimeSec: 60,
  trackPool: [],
  playedTrackIds: [],
  currentTrack: null,
  currentGuess: null,
  currentRoundResult: null,
  roundNumber: 0,
  winner: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INITIALIZE_GAME': {
      const { teams, targetScore, guessTimeSec, trackPool } = action.payload;
      return {
        ...initialState,
        phase: 'setup',
        teams,
        targetScore,
        guessTimeSec,
        trackPool: shuffleArray(trackPool),
        playedTrackIds: [],
      };
    }

    case 'START_ROUND': {
      const availableTracks = state.trackPool.filter(
        (t) => !state.playedTrackIds.includes(t.id)
      );

      if (availableTracks.length === 0) {
        // No more tracks, end game - whoever has more points wins
        const winner =
          state.teams[0].score >= state.teams[1].score
            ? state.teams[0]
            : state.teams[1];
        return { ...state, phase: 'gameover', winner };
      }

      const currentTrack = availableTracks[0];

      return {
        ...state,
        phase: 'listening',
        currentTrack,
        currentGuess: null,
        currentRoundResult: null,
        playedTrackIds: [...state.playedTrackIds, currentTrack.id],
        roundNumber: state.roundNumber + 1,
      };
    }

    case 'LISTENING_COMPLETE':
      return { ...state, phase: 'guessing' };

    case 'SUBMIT_GUESS': {
      const guess = action.payload;
      return {
        ...state,
        phase: 'placing',
        currentGuess: guess,
      };
    }

    case 'PLACE_IN_TIMELINE': {
      if (!state.currentTrack || !state.currentGuess) return state;

      const currentTeam = state.teams[state.currentTeamIndex];
      const isCorrect = validateTimelinePlacement(
        currentTeam.timeline,
        state.currentTrack.releaseYear,
        action.payload.position
      );

      const result = calculateRoundScore(
        state.currentGuess,
        state.currentTrack,
        isCorrect
      );

      const newSong: TimelineSong = {
        trackId: state.currentTrack.id,
        name: state.currentTrack.name,
        artist: state.currentTrack.artist,
        albumArt: state.currentTrack.albumArt,
        actualYear: state.currentTrack.releaseYear,
        guessedYear: state.currentGuess.yearGuess,
        position: action.payload.position,
      };

      const newTimeline = isCorrect
        ? insertIntoTimeline(
            currentTeam.timeline,
            newSong,
            action.payload.position
          )
        : currentTeam.timeline;

      const updatedTeam: Team = {
        ...currentTeam,
        score: currentTeam.score + result.totalPoints,
        timeline: newTimeline,
      };

      const newTeams = [...state.teams] as [Team, Team];
      newTeams[state.currentTeamIndex] = updatedTeam;

      return {
        ...state,
        phase: 'result',
        teams: newTeams,
        currentRoundResult: result,
      };
    }

    case 'SKIP_TIMELINE': {
      if (!state.currentTrack || !state.currentGuess) return state;

      const result = calculateRoundScore(
        state.currentGuess,
        state.currentTrack,
        false
      );

      const currentTeam = state.teams[state.currentTeamIndex];
      const updatedTeam: Team = {
        ...currentTeam,
        score: currentTeam.score + result.totalPoints,
      };

      const newTeams = [...state.teams] as [Team, Team];
      newTeams[state.currentTeamIndex] = updatedTeam;

      return {
        ...state,
        phase: 'result',
        teams: newTeams,
        currentRoundResult: result,
      };
    }

    case 'NEXT_TURN': {
      const currentTeam = state.teams[state.currentTeamIndex];
      if (currentTeam.score >= state.targetScore) {
        return { ...state, phase: 'gameover', winner: currentTeam };
      }

      const nextTeamIndex = state.currentTeamIndex === 0 ? 1 : 0;
      const otherTeam = state.teams[nextTeamIndex];
      if (otherTeam.score >= state.targetScore) {
        return { ...state, phase: 'gameover', winner: otherTeam };
      }

      return {
        ...state,
        currentTeamIndex: nextTeamIndex as 0 | 1,
        currentTrack: null,
        currentGuess: null,
        currentRoundResult: null,
      };
    }

    case 'RESET_GAME':
      return initialState;

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
