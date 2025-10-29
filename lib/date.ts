export function getRelativeLastJoinedDate(lastJoined: number) {
  const now = Date.now();
  const lastJoinedTime = new Date(lastJoined).getTime();
  const diffMs = now - lastJoinedTime;
  const seconds = Math.round(diffMs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (Math.abs(seconds) < 60) {
    return rtf.format(-seconds, 'second');
  } else if (Math.abs(minutes) < 60) {
    return rtf.format(-minutes, 'minute');
  } else if (Math.abs(hours) < 24) {
    return rtf.format(-hours, 'hour');
  } else {
    return rtf.format(-days, 'day');
  }
}

export function getDateInYears(years: number) {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * years);
}
