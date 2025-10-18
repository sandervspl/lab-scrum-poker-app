'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sortParticipantsByVote } from '@/lib/room-utils';
import { cn } from '@/lib/utils';
import type { Participant, Room, Vote } from '@/types';
import { Trash2, Users } from 'lucide-react';

import { AdminControls } from './AdminControls';

interface ParticipantsListProps {
  participants: Participant[];
  votes: Vote[];
  room: Room;
  currentParticipantId: string | null;
  isAdmin: boolean;
  averageVote: string | null;
  onRemoveParticipant: (participantId: string) => void;
  onToggleVotes: () => void;
  onResetVotes: () => void;
}

export function ParticipantsList({
  participants,
  votes,
  room,
  currentParticipantId,
  isAdmin,
  averageVote,
  onRemoveParticipant,
  onToggleVotes,
  onResetVotes,
}: ParticipantsListProps) {
  const sortedParticipants = sortParticipantsByVote(participants, votes, room.votes_revealed);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Participants ({participants.length})
        </CardTitle>
        <AdminControls
          room={room}
          averageVote={averageVote}
          onToggleVotes={onToggleVotes}
          onResetVotes={onResetVotes}
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedParticipants.map((participant) => {
            const vote = votes.find((v) => v.participant_id === participant.participant_id);
            const hasVoted = vote?.vote_value !== null && vote?.vote_value !== undefined;

            return (
              <div
                key={participant.id}
                className="bg-muted/80 flex items-center gap-4 rounded-lg p-3"
              >
                <div className="flex flex-1 items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full font-semibold',
                      hasVoted
                        ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-primary/10 text-primary',
                    )}
                  >
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{participant.name}</p>
                    {participant.participant_id === currentParticipantId && (
                      <p className="text-muted-foreground text-xs">You</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {room.votes_revealed && hasVoted ? (
                    <Badge variant="secondary" className="px-3 py-1 text-base font-semibold">
                      {vote.vote_value}
                    </Badge>
                  ) : hasVoted ? (
                    <Badge variant="secondary">Voted</Badge>
                  ) : (
                    <Badge variant="outline">Waiting</Badge>
                  )}
                  {isAdmin && participant.participant_id !== currentParticipantId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => onRemoveParticipant(participant.participant_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
