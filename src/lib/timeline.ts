import type { TimelineSong } from '@/types/game';

export function validateTimelinePlacement(
  timeline: TimelineSong[],
  newSongYear: number,
  position: number
): boolean {
  const yearBefore =
    position > 0 ? timeline[position - 1].actualYear : -Infinity;
  const yearAfter =
    position < timeline.length ? timeline[position].actualYear : Infinity;

  return newSongYear >= yearBefore && newSongYear <= yearAfter;
}

export function insertIntoTimeline(
  timeline: TimelineSong[],
  song: TimelineSong,
  position: number
): TimelineSong[] {
  const newTimeline = [...timeline];
  newTimeline.splice(position, 0, song);
  return newTimeline.map((s, i) => ({ ...s, position: i }));
}
