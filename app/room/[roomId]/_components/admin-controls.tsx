'use client';

import { Badge } from '@/components/ui/badge';
import { votesQueryOptions } from '@/lib/queries/room-queries';
import { calculateAverage } from '@/lib/room-utils';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { useSuspenseQuery } from '@tanstack/react-query';

import { ResetVotesButton } from './reset-votes-button';
import { ViewVotesButton } from './view-votes-button';

type Props = {
  room: Database['public']['Tables']['rooms']['Row'];
};

export function AdminControls({ room }: Props) {
  const supabase = getSupabaseBrowserClient();
  const { data: votes } = useSuspenseQuery(votesQueryOptions(supabase, room.id));
  const averageVote = votes.data ? calculateAverage(votes.data) : null;

  return (
    <div className="flex items-center gap-3">
      {room?.votes_revealed && averageVote && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Average:</span>
          <Badge variant="default" className="px-3 py-0 text-lg font-bold">
            {averageVote}
          </Badge>
        </div>
      )}

      <ResetVotesButton />
      <ViewVotesButton room={room} />
    </div>
  );
}
