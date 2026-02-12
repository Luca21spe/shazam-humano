import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
    }),
  });

  const data = await tokenResponse.json();

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL('/?error=token_failed', request.url));
  }

  const redirectUrl = new URL('/', request.url);
  redirectUrl.hash = new URLSearchParams({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in.toString(),
  }).toString();

  return NextResponse.redirect(redirectUrl);
}
