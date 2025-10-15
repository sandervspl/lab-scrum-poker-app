export interface Room {
  id: string;
  admin_id: string;
  created_at: string;
  votes_revealed: boolean;
  room_name?: string; // Added optional room_name field
}

export interface Participant {
  id: string;
  room_id: string;
  name: string;
  participant_id: string;
  joined_at: string;
}

export interface Vote {
  id: string;
  room_id: string;
  participant_id: string;
  vote_value: string | null;
  voted_at: string;
}

export const POKER_VALUES = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];
