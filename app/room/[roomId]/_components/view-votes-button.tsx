'use client';

import { Button } from '@/components/ui/button';
import { participantsQueryOptions, votesQueryOptions } from '@/lib/queries/room-queries';
import { allVotesMatch, randomInRange } from '@/lib/room-utils';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { useSuspenseQuery } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

import { useRoomContext } from './context';

type Props = {
  room: Database['public']['Tables']['rooms']['Row'];
};

export function ViewVotesButton({ room }: Props) {
  const supabase = getSupabaseBrowserClient();
  const { hasCelebrated, setHasCelebrated } = useRoomContext();
  const { data: votes } = useSuspenseQuery(votesQueryOptions(supabase, room.id));
  const { data: participants } = useSuspenseQuery(participantsQueryOptions(supabase, room.id));

  // Confetti functions
  function launchConfetti() {
    confetti({
      angle: randomInRange(55, 125),
      spread: randomInRange(50, 70),
      particleCount: randomInRange(50, 100),
      origin: { y: 0.6 },
    });
  }

  async function shootConfetti() {
    launchConfetti();
    await new Promise((resolve) => setTimeout(resolve, 300));
    launchConfetti();
    await new Promise((resolve) => setTimeout(resolve, 300));
    launchConfetti();
  }

  async function viewVotes() {
    const newValue = !room?.votes_revealed;

    const { error } = await supabase
      .from('rooms')
      .update({ votes_revealed: newValue })
      .eq('id', room.id);

    if (error) {
      console.error('[v0] Error toggling votes visibility:', error);
      return;
    }

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
  }

  return (
    <Button onClick={viewVotes} variant="outline" size="sm">
      {room?.votes_revealed ? (
        <>
          <EyeOffIcon className="mr-2 h-4 w-4" />
          Hide Votes
        </>
      ) : (
        <>
          <EyeIcon className="mr-2 h-4 w-4" />
          Show Votes
        </>
      )}
    </Button>
  );
}
