import { NextResponse } from 'next/server';

export async function GET() {
  const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state',
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: scopes,
    redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
    show_dialog: 'true',
  });

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
}
