import Cookies from 'js-cookie';

import { ROOMS_COOKIE } from './cookies';

export interface RoomHistoryItem {
  roomId: string;
  isAdmin: boolean;
  lastJoined: number;
  participantName?: string;
  roomName?: string;
}

export function getRoomHistory(cookie?: string): RoomHistoryItem[] {
  try {
    const stored = cookie ?? Cookies.get(ROOMS_COOKIE);
    if (!stored) return [];

    const rooms = JSON.parse(stored) as RoomHistoryItem[];
    // Sort by most recent first
    return rooms.sort((a, b) => b.lastJoined - a.lastJoined);
  } catch (error) {
    console.error('Error reading room history:', error);
    return [];
  }
}

export function addRoomToHistory(
  roomId: string,
  isAdmin: boolean,
  participantName?: string,
  roomName?: string,
) {
  try {
    const history = getRoomHistory();

    // Remove existing entry for this room if it exists
    const filtered = history.filter((room) => room.roomId !== roomId);

    // Add new entry at the top
    const newEntry: RoomHistoryItem = {
      roomId,
      isAdmin,
      lastJoined: Date.now(),
      participantName,
      roomName,
    };

    filtered.unshift(newEntry);

    // Keep only the last 10 rooms
    const limited = filtered.slice(0, 10);

    Cookies.set(ROOMS_COOKIE, JSON.stringify(limited));
  } catch (error) {
    console.error('Error saving room history:', error);
  }
}

export function removeRoomFromHistory(roomId: string) {
  try {
    const history = getRoomHistory();
    const filtered = history.filter((room) => room.roomId !== roomId);
    Cookies.set(ROOMS_COOKIE, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing room from history:', error);
  }
}

export function updateRoomNameInHistory(roomId: string, roomName: string) {
  try {
    const history = getRoomHistory();
    const room = history.find((r) => r.roomId === roomId);

    if (room) {
      room.roomName = roomName;
      Cookies.set(ROOMS_COOKIE, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error updating room name in history:', error);
  }
}
