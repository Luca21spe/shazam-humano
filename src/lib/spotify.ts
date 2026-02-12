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

export async function fetchPlaylistTracks(
  playlistId: string,
  accessToken: string
): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = [];
  let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&market=from_token`;

  while (url) {
    const fetchUrl: string = url;
    const res: Response = await fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch playlist tracks: ${res.status}`);
    }

    const data = await res.json();

    for (const item of data.items as SpotifyTrackItem[]) {
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
