declare namespace Spotify {
  interface Player {
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: string, callback: (data: unknown) => void): void;
    removeListener(event: string, callback?: (data: unknown) => void): void;
    getCurrentState(): Promise<PlaybackState | null>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(positionMs: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
  }

  interface PlayerInit {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  interface PlaybackState {
    context: { uri: string | null; metadata: Record<string, string> | null };
    disallows: Record<string, boolean>;
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
      current_track: Track;
      previous_tracks: Track[];
      next_tracks: Track[];
    };
  }

  interface Track {
    uri: string;
    id: string;
    type: string;
    name: string;
    duration_ms: number;
    artists: { name: string; uri: string }[];
    album: {
      uri: string;
      name: string;
      images: { url: string; height: number; width: number }[];
    };
  }

  // eslint-disable-next-line no-var
  var Player: {
    new (options: PlayerInit): Player;
  };
}

interface Window {
  onSpotifyWebPlaybackSDKReady: () => void;
  Spotify: typeof Spotify;
}
