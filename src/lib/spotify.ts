import type { SpotifyTrack } from '@/types/game';

interface SpotifyTrackItem {
  track: {
    id: string;
    uri: string;
    name: string;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string; height: number; width: number }[];
      release_date: string;
    };
    is_playable?: boolean;
  } | null;
}

function processItems(items: SpotifyTrackItem[]): SpotifyTrack[] {
  const tracks: SpotifyTrack[] = [];
  for (const item of items) {
    if (!item.track) continue;
    if (item.track.is_playable === false) continue;

    const albumArt =
      item.track.album.images.find((img) => img.height === 300)?.url ||
      item.track.album.images[0]?.url ||
      '';

    tracks.push({
      id: item.track.id,
      uri: item.track.uri,
      name: item.track.name,
      artist: item.track.artists[0]?.name || 'Unknown',
      allArtists: item.track.artists.map((a) => a.name),
      albumName: item.track.album.name,
      albumArt,
      releaseYear: parseInt(
        item.track.album.release_date.substring(0, 4),
        10
      ),
    });
  }
  return tracks;
}

export async function fetchPlaylistTracks(
  playlistId: string,
  accessToken: string
): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = [];

  const playlistRes = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!playlistRes.ok) {
    const errorBody = await playlistRes.text();
    console.error(`Spotify API error ${playlistRes.status}:`, errorBody);
    throw new Error(`Failed to fetch playlist: ${playlistRes.status} - ${errorBody}`);
  }

  const playlist = await playlistRes.json();

  // Log the structure to understand the response format
  console.log('Playlist tracks type:', typeof playlist.tracks, playlist.tracks ? 'exists' : 'missing');
  console.log('Playlist items type:', typeof playlist.items, Array.isArray(playlist.items) ? `array(${playlist.items.length})` : 'not array');
  if (playlist.items && playlist.items.length > 0) {
    console.log('First item keys:', Object.keys(playlist.items[0]));
    console.log('First item sample:', JSON.stringify(playlist.items[0]).substring(0, 500));
  }

  // Handle both formats: tracks in playlist.tracks.items or playlist.items
  const firstPageItems = playlist.tracks?.items || (Array.isArray(playlist.items) ? playlist.items : []);
  const nextUrl = playlist.tracks?.next || playlist.next || null;

  tracks.push(...processItems(firstPageItems));

  // Fetch remaining pages if any
  let url: string | null = nextUrl;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) break;

    const data = await res.json();
    tracks.push(...processItems(data.items || []));
    url = data.next as string | null;
  }

  // Deduplicate by track ID
  const seen = new Set<string>();
  return tracks.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}
