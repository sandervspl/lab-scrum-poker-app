import { QueryOptions, skipToken } from '@tanstack/react-query';

import { TypedSupabaseClient } from '../supabase/types';
import { getParticipant, getParticipants, getRoom, getVotes } from './room-db';

export function roomQueryOptions(supabase: TypedSupabaseClient, roomId: string) {
  return {
    queryKey: ['room', roomId],
    queryFn: () => getRoom(supabase, roomId),
  } satisfies QueryOptions;
}

export function participantsQueryOptions(supabase: TypedSupabaseClient, roomId: string) {
  return {
    queryKey: ['room', roomId, 'participants'],
    queryFn: () => getParticipants(supabase, roomId),
  } satisfies QueryOptions;
}

export function votesQueryOptions(supabase: TypedSupabaseClient, roomId: string) {
  return {
    queryKey: ['room', roomId, 'votes'],
    queryFn: () => getVotes(supabase, roomId),
  } satisfies QueryOptions;
}

function participantQueryOptions(
  supabase: TypedSupabaseClient,
  roomId: string,
  participantId: string | null,
) {
  return {
    queryKey: ['room', roomId, 'participant', participantId],
    queryFn: participantId ? () => getParticipant(supabase, roomId, participantId) : skipToken,
  } satisfies QueryOptions;
}
