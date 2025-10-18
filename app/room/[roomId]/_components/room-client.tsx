'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtime } from '@/app/room/[roomId]/use-realtime';
import {
  participantsQueryOptions,
  roomQueryOptions,
  votesQueryOptions,
} from '@/lib/queries/room-queries';
import { allVotesMatch, calculateAverage, randomInRange } from '@/lib/room-utils';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import confetti from 'canvas-confetti';

import { Button } from '../../../../components/ui/button';
import { JoinRoomForm } from './join-room-form';
import { ParticipantsList } from './participants-list';
import { RoomHeader } from './room-header';
import { VotingCards } from './voting-cards';

type Props = {
  roomId: string;
  participantId: string;
};

export function RoomClient({ roomId, participantId }: Props) {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: room } = useSuspenseQuery(roomQueryOptions(supabase, roomId));
  const { data: participants } = useSuspenseQuery(participantsQueryOptions(supabase, roomId));
  const { data: votes } = useSuspenseQuery(votesQueryOptions(supabase, roomId));

  if (!room.data || !participants.data || !votes.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-2xl font-bold">Oops, something went wrong</p>
        <Button onClick={() => router.refresh()}>Reload page</Button>
      </div>
    );
  }

  // Subscribe to realtime changes
  useRealtime(roomId);

  const isAdmin = participantId === room.data?.admin_id;

  function handleJoined() {
    // Refetch all room queries
    queryClient.invalidateQueries({ queryKey: ['room'] });
  }

  const averageVote = votes.data ? calculateAverage(votes.data) : null;

  if (!participants.data.some((p) => p.participant_id === participantId)) {
    return (
      <JoinRoomForm
        roomId={roomId}
        room={room.data}
        isAdmin={isAdmin}
        currentParticipantId={participantId}
        onJoined={handleJoined}
      />
    );
  }

  return (
    <div className="from-background via-background to-muted/20 min-h-[calc(100vh-3.5rem)] bg-gradient-to-br p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <RoomHeader room={room.data} roomId={roomId} isAdmin={isAdmin} />

        <VotingCards participantId={participantId} />

        {/* Participants and Votes */}
        <ParticipantsList
          participants={participants.data ?? []}
          votes={votes.data ?? []}
          room={room.data}
          userId={participantId}
          isAdmin={isAdmin}
          averageVote={averageVote}
        />
      </div>
    </div>
  );
}
