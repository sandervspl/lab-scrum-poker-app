import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import Cookies from 'js-cookie';

import { getDateInYears } from './date';
import { RoomHistoryItem } from './room-history';

export const ROOMS_COOKIE = 'rooms';
export const PARTICIPANT_COOKIE = 'participant_id';

type CookieReturnValue<T extends ReadonlyRequestCookies | typeof Cookies> =
  T extends ReadonlyRequestCookies ? ReturnType<T['get']> : string;

function isNextCookie(cookie: RequestCookie | string | undefined): cookie is RequestCookie {
  return typeof cookie === 'function';
}

export function generateParticipantCookie(cookieStore: ReadonlyRequestCookies | typeof Cookies) {
  const participantCookie = getParticipantCookie(cookieStore);
  if (participantCookie) {
    return isNextCookie(participantCookie) ? participantCookie.value : participantCookie;
  }

  const id = crypto.randomUUID();
  setParticipantCookie(cookieStore, id);

  return id;
}

function setParticipantCookie(cookieStore: ReadonlyRequestCookies | typeof Cookies, id: string) {
  cookieStore.set(PARTICIPANT_COOKIE, id, {
    expires: getDateInYears(10),
  });
}

export function getParticipantCookie<T extends ReadonlyRequestCookies | typeof Cookies>(
  cookieStore: T,
): CookieReturnValue<T> {
  return cookieStore.get(PARTICIPANT_COOKIE) as any;
}

export function getRoomsCookie<T extends ReadonlyRequestCookies | typeof Cookies>(
  cookieStore: T,
): CookieReturnValue<T> {
  return cookieStore.get(ROOMS_COOKIE) as any;
}

export function setRoomsCookie(rooms: RoomHistoryItem[]) {
  Cookies.set(ROOMS_COOKIE, JSON.stringify(rooms), {
    expires: getDateInYears(10),
  });
}
