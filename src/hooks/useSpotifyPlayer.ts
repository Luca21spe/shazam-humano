'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

interface UseSpotifyPlayerReturn {
  deviceId: string | null;
  deviceName: string | null;
  isReady: boolean;
  isSearchingDevice: boolean;
  noDeviceFound: boolean;
  playTrack: (spotifyUri: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  retryDeviceSearch: () => void;
}

// Whether we're using SDK (in-browser player) or Connect API (external device)
type PlayerMode = 'sdk' | 'connect' | null;

export function useSpotifyPlayer(
  accessToken: string | null
): UseSpotifyPlayerReturn {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSearchingDevice, setIsSearchingDevice] = useState(false);
  const [noDeviceFound, setNoDeviceFound] = useState(false);
  const tokenRef = useRef(accessToken);
  const modeRef = useRef<PlayerMode>(null);
  const sdkPlayerRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);
  const searchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sdkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRef = useRef(false);

  // Keep token ref up to date
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  // ─── Connect API: find external devices ───
  const findDevice = useCallback(async (): Promise<SpotifyDevice | null> => {
    if (!tokenRef.current) return null;

    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });

      if (!res.ok) {
        console.log('[Connect] Failed to fetch devices:', res.status);
        return null;
      }

      const data = await res.json();
      const devices: SpotifyDevice[] = data.devices || [];
      console.log('[Connect] Found devices:', devices.length, devices.map(d => `${d.name} (${d.type}, active:${d.is_active})`));

      if (devices.length === 0) return null;

      const activeDevice = devices.find((d) => d.is_active);
      return activeDevice || devices[0];
    } catch (err) {
      console.error('[Connect] Error fetching devices:', err);
      return null;
    }
  }, []);

  const markReady = useCallback((id: string, name: string, mode: PlayerMode) => {
    if (readyRef.current) return; // Already ready, don't switch
    readyRef.current = true;
    modeRef.current = mode;
    setDeviceId(id);
    setDeviceName(name);
    setIsReady(true);
    setIsSearchingDevice(false);
    setNoDeviceFound(false);
    console.log(`[Player] Ready via ${mode}: ${name} (${id})`);

    // Clean up timers
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }
    if (sdkTimeoutRef.current) {
      clearTimeout(sdkTimeoutRef.current);
      sdkTimeoutRef.current = null;
    }
  }, []);

  // ─── Web Playback SDK: create in-browser player ───
  const initSDK = useCallback(() => {
    if (!tokenRef.current || readyRef.current) return;

    console.log('[SDK] Initializing Web Playback SDK...');

    const p = new (window as any).Spotify.Player({
      name: 'Shazam Humano',
      getOAuthToken: (cb: (token: string) => void) => {
        cb(tokenRef.current || '');
      },
      volume: 0.5,
    });

    p.addListener('ready', (data: any) => {
      const { device_id } = data;
      console.log('[SDK] Player ready, device_id:', device_id);
      sdkPlayerRef.current = p;
      markReady(device_id, 'Shazam Humano (Browser)', 'sdk');
    });

    p.addListener('not_ready', () => {
      console.log('[SDK] Player not ready');
    });

    p.addListener('initialization_error', (data: any) => {
      console.error('[SDK] Initialization error:', data?.message);
    });

    p.addListener('authentication_error', (data: any) => {
      console.error('[SDK] Authentication error:', data?.message);
    });

    p.addListener('account_error', (data: any) => {
      console.error('[SDK] Account error:', data?.message);
    });

    p.connect().then((success: boolean) => {
      console.log('[SDK] connect() result:', success);
    });

    sdkPlayerRef.current = p;
  }, [markReady]);

  const loadSDKScript = useCallback(() => {
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    if ((window as any).Spotify) {
      console.log('[SDK] Spotify already loaded');
      initSDK();
      return;
    }

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      console.log('[SDK] onSpotifyWebPlaybackSDKReady fired');
      initSDK();
    };

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
    console.log('[SDK] Script tag added');
  }, [initSDK]);

  // ─── Main initialization: try both SDK and Connect in parallel ───
  const startSearch = useCallback(() => {
    if (!tokenRef.current) return;

    readyRef.current = false;
    setIsSearchingDevice(true);
    setNoDeviceFound(false);
    setIsReady(false);

    console.log('[Player] Starting hybrid search...');

    // 1. Try Web Playback SDK
    loadSDKScript();

    // 2. In parallel, poll for external devices every 3 seconds
    let attempt = 0;
    const checkDevices = async () => {
      if (readyRef.current) return; // SDK already succeeded

      attempt++;
      console.log(`[Connect] Polling for devices (attempt ${attempt})...`);
      const device = await findDevice();

      if (device && !readyRef.current) {
        markReady(device.id, device.name, 'connect');
        return;
      }

      // After 15 attempts (45s total), give up
      if (attempt >= 15 && !readyRef.current) {
        console.log('[Player] No device found after 15 attempts');
        setIsSearchingDevice(false);
        setNoDeviceFound(true);

        if (searchIntervalRef.current) {
          clearInterval(searchIntervalRef.current);
          searchIntervalRef.current = null;
        }
      }
    };

    // Start polling after a 2-second delay (give SDK a head start)
    sdkTimeoutRef.current = setTimeout(() => {
      if (readyRef.current) return;
      checkDevices();
      searchIntervalRef.current = setInterval(checkDevices, 3000);
    }, 2000);
  }, [findDevice, loadSDKScript, markReady]);

  // Start when we have an access token
  useEffect(() => {
    if (!accessToken) return;

    startSearch();

    return () => {
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
        searchIntervalRef.current = null;
      }
      if (sdkTimeoutRef.current) {
        clearTimeout(sdkTimeoutRef.current);
        sdkTimeoutRef.current = null;
      }
    };
  }, [accessToken, startSearch]);

  const retryDeviceSearch = useCallback(() => {
    // Disconnect old SDK player if any
    if (sdkPlayerRef.current) {
      try { sdkPlayerRef.current.disconnect(); } catch {}
      sdkPlayerRef.current = null;
    }
    scriptLoadedRef.current = false;
    startSearch();
  }, [startSearch]);

  // ─── Playback controls ───
  const playTrack = useCallback(
    async (spotifyUri: string) => {
      if (!deviceId || !tokenRef.current) return;

      console.log(`[Player] Playing track via ${modeRef.current}:`, spotifyUri);

      // Transfer playback to device first
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      });

      // Small delay to let transfer complete
      await new Promise(r => setTimeout(r, 300));

      // Play the track
      const res = await fetch(
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

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[Player] Failed to play:', res.status, errorText);
      }
    },
    [deviceId]
  );

  const pause = useCallback(async () => {
    if (!tokenRef.current || !deviceId) return;

    // If using SDK player, use SDK pause (more reliable)
    if (modeRef.current === 'sdk' && sdkPlayerRef.current) {
      try {
        await sdkPlayerRef.current.pause();
        return;
      } catch {}
    }

    await fetch(
      `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      }
    );
  }, [deviceId]);

  const resume = useCallback(async () => {
    if (!tokenRef.current || !deviceId) return;

    if (modeRef.current === 'sdk' && sdkPlayerRef.current) {
      try {
        await sdkPlayerRef.current.resume();
        return;
      } catch {}
    }

    await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      }
    );
  }, [deviceId]);

  return {
    deviceId,
    deviceName,
    isReady,
    isSearchingDevice,
    noDeviceFound,
    playTrack,
    pause,
    resume,
    retryDeviceSearch,
  };
}
