'use client';

import { PLAYLISTS } from '@/lib/playlists';

interface PlaylistSelectorProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export default function PlaylistSelector({
  selectedIds,
  onToggle,
}: PlaylistSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {PLAYLISTS.map((playlist) => {
        const isSelected = selectedIds.includes(playlist.id);
        return (
          <button
            key={playlist.id}
            onClick={() => onToggle(playlist.id)}
            className={`rounded-xl border p-4 text-left transition-all ${
              isSelected
                ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                : 'border-surface-light bg-surface hover:border-primary/30'
            }`}
          >
            <div className="text-3xl mb-2">
              {playlist.name.includes('70') ? '🕺' :
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
        );
      })}
    </div>
  );
}
