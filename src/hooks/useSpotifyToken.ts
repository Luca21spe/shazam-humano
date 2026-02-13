'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'spotify_token_state';

interface TokenState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

function loadFromStorage(): TokenState {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null, expiresAt: null };
  }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as TokenState;
      // Check if token is still valid (not expired)
      if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
        console.log('[Token] Loaded from sessionStorage, expires in', Math.round((parsed.expiresAt - Date.now()) / 1000), 's');
        return parsed;
      }
      console.log('[Token] Stored token expired, clearing');
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
  return { accessToken: null, refreshToken: null, expiresAt: null };
}

function saveToStorage(state: TokenState) {
  if (typeof window === 'undefined') return;
  try {
    if (state.accessToken) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

export function useSpotifyToken() {
  const [tokenState, setTokenState] = useState<TokenState>(loadFromStorage);
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

      console.log('[Token] Scheduling refresh in', Math.round(msUntilRefresh / 1000), 's');
      refreshTimeoutRef.current = setTimeout(() => {
        doRefresh(refreshToken);
      }, msUntilRefresh);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const doRefresh = async (refreshToken: string) => {
    try {
      console.log('[Token] Refreshing token...');
      const res = await fetch('/api/spotify/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await res.json();
      if (data.access_token) {
        const newExpiresAt = Date.now() + data.expires_in * 1000;
        const newState: TokenState = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || refreshToken,
          expiresAt: newExpiresAt,
        };
        setTokenState(newState);
        saveToStorage(newState);
        scheduleRefresh(data.refresh_token || refreshToken, newExpiresAt);
        console.log('[Token] Refreshed successfully');
      }
    } catch (err) {
      console.error('[Token] Refresh failed:', err);
    }
  };

  // Read token from URL hash (after OAuth callback)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash.substring(1);
    if (!hash) {
      // No hash - if we loaded from storage, schedule refresh
      if (tokenState.refreshToken && tokenState.expiresAt) {
        scheduleRefresh(tokenState.refreshToken, tokenState.expiresAt);
      }
      return;
    }

    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const expiresIn = params.get('expires_in');

    if (accessToken && refreshToken && expiresIn) {
      const expiresAt = Date.now() + parseInt(expiresIn, 10) * 1000;
      const newState: TokenState = { accessToken, refreshToken, expiresAt };
      setTokenState(newState);
      saveToStorage(newState);
      scheduleRefresh(refreshToken, expiresAt);
      console.log('[Token] Stored from URL hash');

      // Clear hash from URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [scheduleRefresh, tokenState.refreshToken, tokenState.expiresAt]);

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
    saveToStorage({ accessToken: null, refreshToken: null, expiresAt: null });
  }, []);

  return {
    accessToken: tokenState.accessToken,
    isAuthenticated: !!tokenState.accessToken,
    logout,
  };
}
