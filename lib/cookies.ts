import Cookies from 'js-cookie';

export const ROOMS_COOKIE = 'rooms';
export const PARTICIPANT_COOKIE = 'participant_id';

export function generateParticipantCookie() {
  const exists = Cookies.get(PARTICIPANT_COOKIE);
  if (exists) {
    return exists;
  }
  const id = crypto.randomUUID();
  Cookies.set(PARTICIPANT_COOKIE, id, {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10), // 10 years
  });
  return id;
}

export function getParticipantCookie() {
  return Cookies.get(PARTICIPANT_COOKIE);
}
