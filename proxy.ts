import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { generateParticipantCookie, getParticipantCookie } from './lib/cookies';

export default async function proxy(request: NextRequest) {
  const cookieStore = await cookies();

  if (!getParticipantCookie(cookieStore)) {
    generateParticipantCookie(cookieStore);
  }

  return NextResponse.next();
}
