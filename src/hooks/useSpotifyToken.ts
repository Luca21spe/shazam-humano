'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TokenState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export function useSpotifyToken() {
  const [tokenState, setTokenState] = useState<TokenState>({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  });
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleRefresh = useCallback(
    (refreshToken: string, expiresAt: number) => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      const msUntilRefresh = expiresAt - Date.now() - 60000;
      if (msUntilRefresh <= 0) {
        doRefresh(refreshToken);
        return;
      }

      refreshTimeoutRef.current = setTimeout(() => {
        doRefresh(refreshToken);
      }, msUntilRefresh);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const doRefresh = async (refreshToken: string) => {
    try {
      const res = await fetch('/api/spotify/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await res.json();
      if (data.access_token) {
        const newExpiresAt = Date.now() + data.expires_in * 1000;
        setTokenState({
          accessToken: data.access_token,
          refreshToken: data.refresh_token || refreshToken,
          expiresAt: newExpiresAt,
        });
        scheduleRefresh(data.refresh_token || refreshToken, newExpiresAt);
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash.substring(1);
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const expiresIn = params.get('expires_in');

    if (accessToken && refreshToken && expiresIn) {
      const expiresAt = Date.now() + parseInt(expiresIn, 10) * 1000;
      setTokenState({ accessToken, refreshToken, expiresAt });
      scheduleRefresh(refreshToken, expiresAt);

      // Clear hash from URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [scheduleRefresh]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const logout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    setTokenState({ accessToken: null, refreshToken: null, expiresAt: null });
  }, []);

  return {
    accessToken: tokenState.accessToken,
    isAuthenticated: !!tokenState.accessToken,
    logout,
  };
}
