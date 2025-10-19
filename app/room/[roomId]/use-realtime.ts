import { useEffect, useEffectEvent } from 'react';
import {
  participantsQueryOptions,
  roomQueryOptions,
  votesQueryOptions,
} from '@/lib/queries/room-queries';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtime(roomId: string) {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  const subscribeToEvents = useEffectEvent(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload: any) => {
          console.log('Room updated:', payload);
          if (payload.new) {
            queryClient.invalidateQueries(roomQueryOptions(supabase, roomId));
            queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('Participants changed:', payload);
          queryClient.invalidateQueries(participantsQueryOptions(supabase, roomId));
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('Vote inserted:', payload);
          queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('Vote updated:', payload);
          queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('Vote deleted:', payload);
          queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
        },
      )
      .subscribe();

    return channel;
  });

  useEffect(() => {
    const channel = subscribeToEvents();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
