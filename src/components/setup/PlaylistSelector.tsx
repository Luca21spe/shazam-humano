'use client';

import { useState } from 'react';
import { PLAYLISTS, type PlaylistOption } from '@/lib/playlists';

interface PlaylistSelectorProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
  customPlaylists: PlaylistOption[];
  onAddCustom: (playlist: PlaylistOption) => void;
  onRemoveCustom: (id: string) => void;
}

function extractPlaylistId(input: string): string | null {
  // Handle full URLs: https://open.spotify.com/playlist/3dcA7tiu9YLqccAj2Y4OwM?si=...
  const urlMatch = input.match(/playlist\/([a-zA-Z0-9]{22})/);
  if (urlMatch) return urlMatch[1];

  // Handle spotify URIs: spotify:playlist:3dcA7tiu9YLqccAj2Y4OwM
  const uriMatch = input.match(/spotify:playlist:([a-zA-Z0-9]{22})/);
  if (uriMatch) return uriMatch[1];

  // Handle raw ID (22 alphanumeric chars)
  const rawMatch = input.trim().match(/^[a-zA-Z0-9]{22}$/);
  if (rawMatch) return rawMatch[0];

  return null;
}

export default function PlaylistSelector({
  selectedIds,
  onToggle,
  customPlaylists,
  onAddCustom,
  onRemoveCustom,
}: PlaylistSelectorProps) {
  const [linkInput, setLinkInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allPlaylists = [...PLAYLISTS, ...customPlaylists];

  const handleAddPlaylist = async () => {
    const playlistId = extractPlaylistId(linkInput.trim());
    if (!playlistId) {
      setError('Link inválido. Pegá un link de Spotify como: https://open.spotify.com/playlist/...');
      return;
    }

    // Check if already added
    if (allPlaylists.some((p) => p.id === playlistId)) {
      setError('Esta playlist ya está agregada');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to get playlist name from Spotify (optional - works if user is logged in)
      const tokenData = sessionStorage.getItem('spotify_token_state');
      let name = `Playlist ${customPlaylists.length + 1}`;

      if (tokenData) {
        const { accessToken } = JSON.parse(tokenData);
        if (accessToken) {
          const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}?fields=name,description`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            name = data.name || name;
          }
        }
      }

      const newPlaylist: PlaylistOption = {
        id: playlistId,
        name,
        description: 'Playlist agregada por link',
      };

      onAddCustom(newPlaylist);
      onToggle(playlistId); // Auto-select
      setLinkInput('');
    } catch {
      setError('Error al agregar la playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPlaylist();
    }
  };

  return (
    <div className="space-y-4">
      {/* Add custom playlist input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={linkInput}
          onChange={(e) => { setLinkInput(e.target.value); setError(null); }}
          onKeyDown={handleKeyDown}
          placeholder="Pegá un link de Spotify playlist..."
          className="flex-1 bg-surface-light rounded-xl px-4 py-3 text-text-primary outline-none border border-transparent focus:border-primary/50 transition-colors text-sm"
        />
        <button
          onClick={handleAddPlaylist}
          disabled={!linkInput.trim() || isLoading}
          className="px-4 py-3 bg-primary hover:bg-primary/90 disabled:bg-surface-light disabled:text-text-secondary text-white rounded-xl font-semibold text-sm transition-colors whitespace-nowrap"
        >
          {isLoading ? '...' : '+ Agregar'}
        </button>
      </div>

      {error && (
        <p className="text-accent text-xs">{error}</p>
      )}

      {/* Playlist grid */}
      {allPlaylists.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {allPlaylists.map((playlist) => {
            const isSelected = selectedIds.includes(playlist.id);
            const isCustom = customPlaylists.some((p) => p.id === playlist.id);
            return (
              <div key={playlist.id} className="relative">
                <button
                  onClick={() => onToggle(playlist.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-surface-light bg-surface hover:border-primary/30'
                  }`}
                >
                  <div className="text-3xl mb-2">
                    {isCustom ? '🔗' :
                     playlist.name.includes('70') ? '🕺' :
                     playlist.name.includes('80') ? '🎸' :
                     playlist.name.includes('90') ? '💿' :
                     playlist.name.includes('2000') ? '📀' :
                     playlist.name.includes('2010') ? '🎧' :
                     playlist.name.includes('Rock C') ? '🤘' :
                     playlist.name.includes('Espanol') ? '🎵' :
                     playlist.name.includes('Reggaeton') ? '🔥' :
                     playlist.name.includes('Top') ? '🏆' : '🎶'}
                  </div>
                  <div className="font-medium text-sm text-text-primary truncate">
                    {playlist.name}
                  </div>
                  <div className="text-xs text-text-secondary mt-1 truncate">
                    {playlist.description}
                  </div>
                  {isSelected && (
                    <div className="mt-2 text-primary text-xs font-semibold">
                      Seleccionada
                    </div>
                  )}
                </button>
                {/* Remove button for custom playlists */}
                {isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveCustom(playlist.id);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-accent text-white rounded-full text-xs flex items-center justify-center hover:bg-accent/80 transition-colors"
                    title="Quitar playlist"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {allPlaylists.length === 0 && (
        <p className="text-text-secondary text-sm text-center py-4">
          Agregá una playlist de Spotify para empezar
        </p>
      )}
    </div>
  );
}
