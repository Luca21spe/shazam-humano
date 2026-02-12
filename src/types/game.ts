export interface TeamMember {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  score: number;
  timeline: TimelineSong[];
}

export interface TimelineSong {
  trackId: string;
  name: string;
  artist: string;
  albumArt: string;
  actualYear: number;
  guessedYear: number;
  position: number;
}

export interface RoundGuess {
  artistGuess: string;
  songGuess: string;
  yearGuess: number;
}

export interface RoundResult {
  trackId: string;
  songName: string;
  artistName: string;
  actualYear: number;
  guess: RoundGuess;
  artistPoints: number;
  songPoints: number;
  yearRangePoints: number;
  yearExactBonus: number;
  totalPoints: number;
  timelinePlacementCorrect: boolean;
}

export type GamePhase =
  | 'setup'
  | 'listening'
  | 'guessing'
  | 'placing'
  | 'result'
  | 'gameover';

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artist: string;
  allArtists: string[];
  albumName: string;
  albumArt: string;
  releaseYear: number;
}

export interface GameState {
  phase: GamePhase;
  teams: [Team, Team];
  currentTeamIndex: 0 | 1;
  targetScore: number;
  guessTimeSec: number;
  trackPool: SpotifyTrack[];
  playedTrackIds: string[];
  currentTrack: SpotifyTrack | null;
  currentGuess: RoundGuess | null;
  currentRoundResult: RoundResult | null;
  roundNumber: number;
  winner: Team | null;
}

export type GameAction =
  | {
      type: 'INITIALIZE_GAME';
      payload: {
        teams: [Team, Team];
        targetScore: number;
        guessTimeSec: number;
        trackPool: SpotifyTrack[];
      };
    }
  | { type: 'START_ROUND' }
  | { type: 'LISTENING_COMPLETE' }
  | { type: 'SUBMIT_GUESS'; payload: RoundGuess }
  | { type: 'PLACE_IN_TIMELINE'; payload: { position: number } }
  | { type: 'SKIP_TIMELINE' }
  | { type: 'NEXT_TURN' }
  | { type: 'RESET_GAME' };
