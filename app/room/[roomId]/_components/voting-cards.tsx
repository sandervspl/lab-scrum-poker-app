'use client';

import { startTransition, useOptimistic } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { roomQueryOptions, votesQueryOptions } from '@/lib/queries/room-queries';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';
import { getTshirtDefinitions, getVotingValues, TshirtDefinitions } from '@/types';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

export function VotingCards({ participantId }: { participantId: string }) {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const { roomId } = useParams<{ roomId: string }>();
  const { data: room } = useSuspenseQuery(roomQueryOptions(supabase, roomId));
  const { data: votes } = useSuspenseQuery(votesQueryOptions(supabase, roomId));
  const [optimisticVote, setOptimisticVote] = useOptimistic<
    Database['public']['Tables']['votes']['Row']['vote_value'] | null
  >(votes.data?.find((v) => v.participant_id === participantId)?.vote_value ?? null);
  const votingMode = room.data?.voting_mode ?? 'fibonacci';
  const votingValues = getVotingValues(votingMode);
  const isTshirtMode = votingMode === 'tshirt';
  const definitions = getTshirtDefinitions(room.data?.tshirt_definitions as TshirtDefinitions);

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
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">
          Select Your Vote
          {isTshirtMode && (
            <span className="text-muted-foreground ml-2 text-sm font-normal">(T-Shirt Sizing)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'grid gap-3',
            isTshirtMode ? 'grid-cols-4 sm:grid-cols-8' : 'grid-cols-5 sm:grid-cols-10',
          )}
        >
          {votingValues.map((value) => {
            const definition = isTshirtMode ? definitions[value] : undefined;
            return (
              <button
                key={value}
                type="button"
                onClick={() => castVote(value)}
                className={cn(
                  'flex aspect-3/4 cursor-pointer flex-col items-center justify-center rounded-lg border-2 transition-all hover:scale-105 hover:shadow-lg',
                  optimisticVote === value
                    ? 'border-primary bg-primary text-primary-foreground scale-105 shadow-lg'
                    : 'border-border bg-card hover:border-primary/50',
                )}
              >
                <span className="text-2xl font-bold">{value}</span>
                {definition && (
                  <span
                    className={cn(
                      'mt-1 max-w-full truncate px-1 text-[10px] leading-tight',
                      optimisticVote === value
                        ? 'text-primary-foreground/80'
                        : 'text-muted-foreground',
                    )}
                  >
                    {definition}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
