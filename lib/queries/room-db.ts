import { TypedSupabaseClient } from '../supabase/types';

export async function getRoom(supabase: TypedSupabaseClient, roomId: string) {
  return supabase.from('rooms').select('*').eq('id', roomId).single();
}

export async function getParticipants(supabase: TypedSupabaseClient, roomId: string) {
  return supabase
    .from('participants')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });
}

export async function getVotes(supabase: TypedSupabaseClient, roomId: string) {
  return supabase.from('votes').select('*').eq('room_id', roomId);
}

export async function getParticipantCheck(
  supabase: TypedSupabaseClient,
  roomId: string,
  participantId: string,
) {
  return supabase
    .from('participants')
    .select('*')
    .eq('room_id', roomId)
    .eq('participant_id', participantId)
    .single();
}
