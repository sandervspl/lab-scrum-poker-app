import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { generateParticipantCookie, getParticipantCookie } from './lib/cookies';

export default async function middleware(request: NextRequest) {
  const cookieStore = await cookies();
  if (!getParticipantCookie(cookieStore)) {
    generateParticipantCookie();
  }
  return NextResponse.next();
}
