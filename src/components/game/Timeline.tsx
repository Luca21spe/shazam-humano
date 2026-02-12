'use client';

import Image from 'next/image';
import type { TimelineSong, SpotifyTrack } from '@/types/game';

interface TimelineProps {
  timeline: TimelineSong[];
  newTrack: SpotifyTrack | null;
  onPlace: (position: number) => void;
  onSkip: () => void;
  isPlacing: boolean;
}

export default function Timeline({
  timeline,
  newTrack,
  onPlace,
  onSkip,
  isPlacing,
}: TimelineProps) {
  if (!isPlacing || !newTrack) {
    // Display-only mode
    if (timeline.length === 0) {
      return (
        <div className="text-center text-text-secondary text-sm py-4">
          Timeline vacia
        </div>
      );
    }
    return (
      <div className="timeline-scroll overflow-x-auto pb-2">
        <div className="flex items-center gap-1 min-w-max px-2">
          {timeline.map((song) => (
            <TimelineCard key={song.trackId} song={song} />
          ))}
        </div>
      </div>
    );
  }

  // Placing mode: show gaps between songs
  return (
    <div className="space-y-4">
      {/* New song to place */}
      <div className="flex items-center justify-center gap-3 rounded-xl bg-primary/10 border border-primary/30 p-3">
        {newTrack.albumArt && (
          <Image
            src={newTrack.albumArt}
            alt={newTrack.name}
            width={48}
            height={48}
            className="rounded-lg"
          />
        )}
        <div>
          <div className="font-bold text-text-primary text-sm">
            {newTrack.name}
          </div>
          <div className="text-text-secondary text-xs">{newTrack.artist}</div>
        </div>
        <div className="text-primary font-bold text-sm ml-auto">
          Ubicar en la timeline
        </div>
      </div>

      {/* Timeline with gaps */}
      <div className="timeline-scroll overflow-x-auto pb-2">
        <div className="flex items-center min-w-max px-2">
          {/* Gap before first */}
          <PlacementGap
            position={0}
            onPlace={onPlace}
            label={
              timeline.length > 0
                ? `Antes de ${timeline[0].actualYear}`
                : 'Colocar aqui'
            }
          />

          {timeline.map((song, i) => (
            <div key={song.trackId} className="flex items-center">
              <TimelineCard song={song} />
              <PlacementGap
                position={i + 1}
                onPlace={onPlace}
                label={
                  i + 1 < timeline.length
                    ? `Entre ${song.actualYear} y ${timeline[i + 1].actualYear}`
                    : `Despues de ${song.actualYear}`
                }
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onSkip}
        className="w-full rounded-xl border border-text-secondary/30 text-text-secondary hover:border-accent/50 hover:text-accent py-2 text-sm transition-colors"
      >
        Saltar ubicacion (0 puntos de rango)
      </button>
    </div>
  );
}

function TimelineCard({ song }: { song: TimelineSong }) {
  return (
    <div className="flex flex-col items-center gap-1 px-2">
      {song.albumArt && (
        <Image
          src={song.albumArt}
          alt={song.name}
          width={48}
          height={48}
          className="rounded-lg"
        />
      )}
      <div className="text-xs text-text-primary font-medium truncate max-w-[64px] text-center">
        {song.name}
      </div>
      <div className="text-xs text-text-secondary">{song.actualYear}</div>
    </div>
  );
}

function PlacementGap({
  position,
  onPlace,
  label,
}: {
  position: number;
  onPlace: (pos: number) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onPlace(position)}
      className="timeline-gap flex flex-col items-center justify-center min-w-[60px] h-20 mx-1 rounded-lg border-2 border-dashed border-text-secondary/20 hover:border-primary hover:bg-primary/10 transition-all group"
      title={label}
    >
      <span className="text-text-secondary group-hover:text-primary text-xl transition-colors">
        +
      </span>
      <span className="text-[10px] text-text-secondary group-hover:text-primary/70 transition-colors px-1 text-center leading-tight">
        {label}
      </span>
    </button>
  );
}
