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

export function useSpotifyPlayer(
  accessToken: string | null
): UseSpotifyPlayerReturn {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSearchingDevice, setIsSearchingDevice] = useState(false);
  const [noDeviceFound, setNoDeviceFound] = useState(false);
  const tokenRef = useRef(accessToken);
  const searchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchAttemptRef = useRef(0);

  // Keep token ref up to date
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const findDevice = useCallback(async (): Promise<SpotifyDevice | null> => {
    if (!tokenRef.current) return null;

    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });

      if (!res.ok) {
        console.error('Failed to fetch devices:', res.status);
        return null;
      }

      const data = await res.json();
      const devices: SpotifyDevice[] = data.devices || [];

      if (devices.length === 0) return null;

      // Prefer active device, otherwise use the first one
      const activeDevice = devices.find((d) => d.is_active);
      return activeDevice || devices[0];
    } catch (err) {
      console.error('Error fetching devices:', err);
      return null;
    }
  }, []);

  const startDeviceSearch = useCallback(() => {
    setIsSearchingDevice(true);
    setNoDeviceFound(false);
    searchAttemptRef.current = 0;

    // Clear any existing interval
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
    }

    // Check immediately, then poll every 3 seconds
    const checkDevices = async () => {
      const device = await findDevice();
      searchAttemptRef.current++;

      if (device) {
        setDeviceId(device.id);
        setDeviceName(device.name);
        setIsReady(true);
        setIsSearchingDevice(false);
        setNoDeviceFound(false);

        if (searchIntervalRef.current) {
          clearInterval(searchIntervalRef.current);
          searchIntervalRef.current = null;
        }
        return;
      }

      // After 10 attempts (30s), stop polling and show error
      if (searchAttemptRef.current >= 10) {
        setIsSearchingDevice(false);
        setNoDeviceFound(true);

        if (searchIntervalRef.current) {
          clearInterval(searchIntervalRef.current);
          searchIntervalRef.current = null;
        }
      }
    };

    checkDevices();
    searchIntervalRef.current = setInterval(checkDevices, 3000);
  }, [findDevice]);

  // Start searching when we have an access token
  useEffect(() => {
    if (!accessToken) return;

    startDeviceSearch();

    return () => {
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
        searchIntervalRef.current = null;
      }
    };
  }, [accessToken, startDeviceSearch]);

  const retryDeviceSearch = useCallback(() => {
    startDeviceSearch();
  }, [startDeviceSearch]);

  const playTrack = useCallback(
    async (spotifyUri: string) => {
      if (!deviceId || !tokenRef.current) return;

      // First transfer playback to the device
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

      // Then play the track
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
        console.error('Failed to play track:', res.status, await res.text());
      }
    },
    [deviceId]
  );

  const pause = useCallback(async () => {
    if (!tokenRef.current || !deviceId) return;

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
