'use client';

import { startTransition, useOptimistic } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { votesQueryOptions } from '@/lib/queries/room-queries';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';
import { POKER_VALUES } from '@/types';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

export function VotingCards({ participantId }: { participantId: string }) {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const { roomId } = useParams<{ roomId: string }>();
  const { data: votes } = useSuspenseQuery(votesQueryOptions(supabase, roomId));
  const [optimisticVote, setOptimisticVote] = useOptimistic<
    Database['public']['Tables']['votes']['Row']['vote_value'] | null
  >(votes.data?.find((v) => v.participant_id === participantId)?.vote_value ?? null);

  console.log(
    'Optimistic vote:',
    votes.data,
    participantId,
    optimisticVote,
    votes.data?.find((v) => v.participant_id === participantId)?.vote_value,
  );

  async function castVote(value: string) {
    if (!participantId) {
      console.log('Cannot cast vote: no participant ID');
      return;
    }

    console.log('Casting vote:', { roomId, participantId, value });

    startTransition(async () => {
      setOptimisticVote(value);
      console.log('Updating existing vote');
      await supabase.from('votes').upsert(
        { vote_value: value, participant_id: participantId, room_id: roomId },
        {
          onConflict: 'room_id, participant_id',
        },
      );

      await queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Select Your Vote</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
          {POKER_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => castVote(value)}
              className={cn(
                'flex aspect-[3/4] cursor-pointer items-center justify-center rounded-lg border-2 text-2xl font-bold transition-all hover:scale-105 hover:shadow-lg',
                optimisticVote === value
                  ? 'border-primary bg-primary text-primary-foreground scale-105 shadow-lg'
                  : 'border-border bg-card hover:border-primary/50',
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
