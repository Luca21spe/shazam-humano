import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state',
    'playlist-read-private',
    'playlist-read-collaborative',
  ].join(' ');

  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

  console.log('Auth redirect URI:', redirectUri);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: scopes,
    redirect_uri: redirectUri,
    show_dialog: 'true',
  });

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
}
