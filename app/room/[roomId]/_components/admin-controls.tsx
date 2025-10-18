'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database } from '@/lib/supabase/database.types';
import { Eye, EyeOff } from 'lucide-react';

import { ResetVotesButton } from './reset-votes-button';
import { ViewVotesButton } from './view-votes-button';

type Props = {
  room: Database['public']['Tables']['rooms']['Row'];
  averageVote: string | null;
};

export function AdminControls({ room, averageVote }: Props) {
  return (
    <div className="flex items-center gap-3">
      {room?.votes_revealed && averageVote && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Average:</span>
          <Badge variant="default" className="px-3 py-1 text-lg font-bold">
            {averageVote}
          </Badge>
        </div>
      )}
      <ResetVotesButton />
      <ViewVotesButton room={room} />
    </div>
  );
}
