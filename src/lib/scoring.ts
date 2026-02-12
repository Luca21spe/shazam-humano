import { stringSimilarity } from 'string-similarity-js';
import type { RoundGuess, RoundResult, SpotifyTrack } from '@/types/game';

const SIMILARITY_THRESHOLD = 0.6;

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\b(the|a|an|el|la|los|las|le|les)\b/gi, '')
    .replace(/\b(feat\.?|ft\.?|featuring)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isMatch(guess: string, actual: string): boolean {
  if (!guess.trim()) return false;

  const normalizedGuess = normalize(guess);
  const normalizedActual = normalize(actual);

  if (!normalizedGuess || !normalizedActual) return false;

  if (normalizedGuess === normalizedActual) return true;

  if (
    normalizedActual.includes(normalizedGuess) ||
    normalizedGuess.includes(normalizedActual)
  ) {
    return true;
  }

  const similarity = stringSimilarity(normalizedGuess, normalizedActual);
  return similarity >= SIMILARITY_THRESHOLD;
}

export function isArtistMatch(
  guess: string,
  primaryArtist: string,
  allArtists: string[]
): boolean {
  if (isMatch(guess, primaryArtist)) return true;
  return allArtists.some((artist) => isMatch(guess, artist));
}

export function calculateRoundScore(
  guess: RoundGuess,
  track: SpotifyTrack,
  timelinePlacementCorrect: boolean
): RoundResult {
  const artistPoints = isArtistMatch(
    guess.artistGuess,
    track.artist,
    track.allArtists
  )
    ? 0.5
    : 0;
  const songPoints = isMatch(guess.songGuess, track.name) ? 0.5 : 0;

  let yearRangePoints = 0;
  let yearExactBonus = 0;

  if (timelinePlacementCorrect) {
    yearRangePoints = 1;
    if (guess.yearGuess === track.releaseYear) {
      yearExactBonus = 0.5;
    }
  }

  const totalPoints = artistPoints + songPoints + yearRangePoints + yearExactBonus;

  return {
    trackId: track.id,
    songName: track.name,
    artistName: track.artist,
    actualYear: track.releaseYear,
    guess,
    artistPoints,
    songPoints,
    yearRangePoints,
    yearExactBonus,
    totalPoints,
    timelinePlacementCorrect,
  };
}
