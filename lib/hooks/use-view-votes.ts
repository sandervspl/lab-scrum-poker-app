import { startTransition, useOptimistic } from 'react';
import { useParams } from 'next/navigation';
import { useRoomContext } from '@/app/room/[roomId]/_components/context';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import {
  participantsQueryOptions,
  roomQueryOptions,
  votesQueryOptions,
} from '../queries/room-queries';
import { allVotesMatch } from '../room-utils';
import { getSupabaseBrowserClient } from '../supabase/client';
import { useConfetti } from './use-confetti';

export function useViewVotes() {
  const supabase = getSupabaseBrowserClient();
  const { roomId } = useParams<{ roomId: string }>();
  const { data: room } = useSuspenseQuery(roomQueryOptions(supabase, roomId));
  const { data: votes } = useSuspenseQuery(votesQueryOptions(supabase, roomId));
  const { data: participants } = useSuspenseQuery(participantsQueryOptions(supabase, roomId));
  const [isRevealed, setIsRevealed] = useOptimistic(room?.data?.votes_revealed ?? false);
  // const newValue = !room?.data?.votes_revealed;
  const { hasCelebrated, setHasCelebrated } = useRoomContext();
  const { shootConfetti } = useConfetti();
  const queryClient = useQueryClient();

  function viewVotes() {
    startTransition(async () => {
      const newValue = !isRevealed;
      setIsRevealed(newValue);

      const { error } = await supabase
        .from('rooms')
        .update({ votes_revealed: newValue })
        .eq('id', roomId);

      if (error) {
        setIsRevealed(!newValue);
        console.error('[v0] Error toggling votes visibility:', error.message);
        return;
      }

      await queryClient.invalidateQueries(roomQueryOptions(supabase, roomId));

      if (
        newValue &&
        !hasCelebrated &&
        votes.data &&
        participants.data &&
        allVotesMatch(votes.data, participants.data)
      ) {
        shootConfetti();
        setHasCelebrated(true);
      }
    });
  }

  return { viewVotes, isRevealed };
}
