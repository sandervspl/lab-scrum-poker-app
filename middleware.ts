import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { PARTICIPANT_COOKIE } from './lib/cookies';

export default async function middleware(request: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get(PARTICIPANT_COOKIE)) {
    cookieStore.set(PARTICIPANT_COOKIE, crypto.randomUUID());
  }
  return NextResponse.next();
}
