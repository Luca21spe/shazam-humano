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

  // Log full response structure for debugging
  console.log('Full playlist keys:', Object.keys(playlist));
  if (playlist.items) {
    console.log('Items type:', typeof playlist.items, 'isArray:', Array.isArray(playlist.items));
    if (typeof playlist.items === 'object' && !Array.isArray(playlist.items)) {
      console.log('Items object keys:', Object.keys(playlist.items));
    }
  }

  // Handle all possible response formats from Spotify API
  let firstPageItems: SpotifyTrackItem[] = [];
  let nextUrl: string | null = null;

  if (playlist.tracks?.items && Array.isArray(playlist.tracks.items)) {
    // Standard format: playlist.tracks.items[]
    firstPageItems = playlist.tracks.items;
    nextUrl = playlist.tracks.next || null;
  } else if (Array.isArray(playlist.items)) {
    // Alt format: playlist.items[]
    firstPageItems = playlist.items;
    nextUrl = playlist.next || null;
  } else if (playlist.items?.items && Array.isArray(playlist.items.items)) {
    // Nested format: playlist.items.items[]
    firstPageItems = playlist.items.items;
    nextUrl = playlist.items.next || null;
  } else if (playlist.items && typeof playlist.items === 'object') {
    // items is a paginated object - try to get href and fetch tracks separately
    const tracksHref = playlist.items.href || playlist.href;
    if (tracksHref) {
      console.log('Fetching tracks from href:', tracksHref);
      const tracksRes = await fetch(tracksHref, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (tracksRes.ok) {
        const tracksData = await tracksRes.json();
        firstPageItems = tracksData.items || [];
        nextUrl = tracksData.next || null;
      }
    }
  }

  console.log('First page items count:', firstPageItems.length);
  if (firstPageItems.length > 0) {
    console.log('First item structure:', JSON.stringify(firstPageItems[0]).substring(0, 500));
  }

  tracks.push(...processItems(firstPageItems));
  console.log('Processed tracks count:', tracks.length);

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
