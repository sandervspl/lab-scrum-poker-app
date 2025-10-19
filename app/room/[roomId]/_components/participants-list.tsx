'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sortParticipantsByVote } from '@/lib/room-utils';
import { Database } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

import { AdminControls } from './admin-controls';
import { RemoveParticipantButton } from './remove-participant-button';

type Props = {
  participants: Database['public']['Tables']['participants']['Row'][];
  votes: Database['public']['Tables']['votes']['Row'][];
  room: Database['public']['Tables']['rooms']['Row'];
  userId: string | null;
  isAdmin: boolean;
};

export function ParticipantsList({ participants, votes, room, userId, isAdmin }: Props) {
  const sortedParticipants = sortParticipantsByVote(
    participants,
    votes,
    room?.votes_revealed ?? false,
  );

  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          <span className="hidden sm:block">Participants</span> ({participants.length})
        </CardTitle>
        <AdminControls room={room} />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedParticipants.map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              votes={votes}
              room={room}
              userId={userId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ParticipantCard({
  participant,
  votes,
  room,
  userId,
  isAdmin,
}: {
  participant: Database['public']['Tables']['participants']['Row'];
  room: Database['public']['Tables']['rooms']['Row'];
  votes: Database['public']['Tables']['votes']['Row'][];
  userId: string | null;
  isAdmin: boolean;
}) {
  const vote = votes.find((v) => v.participant_id === participant.participant_id);
  const hasVoted = vote?.vote_value !== null && vote?.vote_value !== undefined;

  return (
    <div key={participant.id} className="bg-muted/80 flex items-center gap-4 rounded-lg p-3">
      <div className="flex flex-1 items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full font-semibold',
            hasVoted
              ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-secondary',
          )}
        >
          {participant.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium">{participant.name}</p>
          {participant.participant_id === userId && (
            <p className="text-muted-foreground text-xs">You</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {room?.votes_revealed && hasVoted ? (
          <Badge
            variant="secondary"
            className="aspect-[3/4] rounded-md px-3 py-1 text-base font-semibold"
          >
            {vote.vote_value}
          </Badge>
        ) : hasVoted ? (
          <Badge variant="secondary">Voted</Badge>
        ) : (
          <Badge variant="outline">Waiting</Badge>
        )}
        {isAdmin && participant.participant_id !== userId && (
          <RemoveParticipantButton participantId={participant.participant_id} />
        )}
      </div>
    </div>
  );
}
