import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
  }

  try {
    const tracks: unknown[] = [];
    let url: string | null = `https://api.spotify.com/v1/playlists/${id}/tracks?limit=50`;

    while (url) {
      const fetchUrl: string = url;
      const res: Response = await fetch(fetchUrl, {
        headers: { Authorization: authHeader },
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Spotify API error: ${res.status}` },
          { status: res.status }
        );
      }

      const data = await res.json();
      tracks.push(...data.items);
      url = data.next as string | null;
    }

    return NextResponse.json({ items: tracks });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}
