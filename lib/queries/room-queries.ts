'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query';

import { getParticipantCheck, getParticipants, getRoom, getVotes } from './room-db';

export function useRoomQuery(roomId: string) {
  const supabase = getSupabaseBrowserClient();
  return useQuery(getRoom(supabase, roomId));
}

export function useParticipantsQuery(roomId: string) {
  const supabase = getSupabaseBrowserClient();
  return useQuery(getParticipants(supabase, roomId));
}

export function useVotesQuery(roomId: string) {
  const supabase = getSupabaseBrowserClient();
  return useQuery(getVotes(supabase, roomId));
}

export function useParticipantCheckQuery(
  roomId: string,
  participantId: string,
  enabled: boolean = true,
) {
  const supabase = getSupabaseBrowserClient();
  return useQuery(getParticipantCheck(supabase, roomId, participantId), {
    enabled: !!participantId && enabled,
  });
}
