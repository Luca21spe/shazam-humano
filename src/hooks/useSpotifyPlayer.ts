'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpotifyPlayerReturn {
  player: Spotify.Player | null;
  deviceId: string | null;
  isReady: boolean;
  playTrack: (spotifyUri: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
}

export function useSpotifyPlayer(
  accessToken: string | null
): UseSpotifyPlayerReturn {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const tokenRef = useRef(accessToken);
  const scriptLoadedRef = useRef(false);
  const playerRef = useRef<Spotify.Player | null>(null);

  // Keep token ref up to date for the SDK callback
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    if (scriptLoadedRef.current) return;

    const initPlayer = () => {
      const p = new window.Spotify.Player({
        name: 'Shazam Humano',
        getOAuthToken: (cb) => {
          cb(tokenRef.current || '');
        },
        volume: 0.5,
      });

      p.addListener('ready', (data: unknown) => {
        const { device_id } = data as { device_id: string };
        setDeviceId(device_id);
        setIsReady(true);
      });

      p.addListener('not_ready', () => {
        setIsReady(false);
      });

      p.addListener('initialization_error', (data: unknown) => {
        const { message } = data as { message: string };
        console.error('Spotify initialization error:', message);
      });

      p.addListener('authentication_error', (data: unknown) => {
        const { message } = data as { message: string };
        console.error('Spotify authentication error:', message);
      });

      p.addListener('account_error', (data: unknown) => {
        const { message } = data as { message: string };
        console.error('Spotify account error:', message);
      });

      p.connect();
      setPlayer(p);
      playerRef.current = p;
    };

    // Check if SDK is already loaded
    if (window.Spotify) {
      initPlayer();
      scriptLoadedRef.current = true;
      return;
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      initPlayer();
    };

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
    scriptLoadedRef.current = true;

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, [accessToken]);

  const playTrack = useCallback(
    async (spotifyUri: string) => {
      if (!deviceId || !tokenRef.current) return;

      await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenRef.current}`,
          },
          body: JSON.stringify({ uris: [spotifyUri] }),
        }
      );
    },
    [deviceId]
  );

  const pause = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.pause();
    }
  }, []);

  const resume = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.resume();
    }
  }, []);

  return { player, deviceId, isReady, playTrack, pause, resume };
}
