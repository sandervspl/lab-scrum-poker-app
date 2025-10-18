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
  const [hasCelebrated, setHasCelebrated] = useState(false);

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

  const isAdmin = participantId === room.data?.admin_id;

  // Subscribe to realtime changes
  useRealtime(roomId);

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

  function handleJoined() {
    // Refetch all room queries
    queryClient.invalidateQueries({ queryKey: ['room'] });
  }

  async function toggleVotesVisibility() {
    const newValue = !room.data?.votes_revealed;

    const { error } = await supabase
      .from('rooms')
      .update({ votes_revealed: newValue })
      .eq('id', roomId);

    if (error) {
      console.error('[v0] Error toggling votes visibility:', error);
      return;
    }

    queryClient.invalidateQueries(roomQueryOptions(supabase, roomId));
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

  async function resetVotes() {
    console.log('[v0] Resetting votes');
    const { error: votesError } = await supabase.from('votes').delete().eq('room_id', roomId);

    if (votesError) {
      console.error('[v0] Error deleting votes:', votesError);
      return;
    }

    console.log('[v0] Votes deleted successfully');

    await supabase.from('rooms').update({ votes_revealed: false }).eq('id', roomId);

    queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
    queryClient.invalidateQueries(roomQueryOptions(supabase, roomId));
    setHasCelebrated(false);
  }

  async function removeParticipant(participantIdToRemove: string) {
    if (!isAdmin) return;

    // Prevent admin from removing themselves
    if (participantIdToRemove === participantId) {
      alert('You cannot remove yourself from the room');
      return;
    }

    const confirmRemove = confirm('Are you sure you want to remove this participant?');
    if (!confirmRemove) return;

    console.log('[v0] Removing participant:', participantId);

    // Delete participant's votes first
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .eq('room_id', roomId)
      .eq('participant_id', participantId);

    if (votesError) {
      console.error('[v0] Error deleting participant votes:', votesError);
    }

    // Delete participant
    const { error: participantError } = await supabase
      .from('participants')
      .delete()
      .eq('room_id', roomId)
      .eq('participant_id', participantId);

    if (participantError) {
      console.error('[v0] Error removing participant:', participantError);
      alert('Failed to remove participant');
      return;
    }

    console.log('[v0] Participant removed successfully');
    queryClient.invalidateQueries(participantsQueryOptions(supabase, roomId));
    queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
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
          currentParticipantId={participantId}
          isAdmin={isAdmin}
          averageVote={averageVote}
          onRemoveParticipant={removeParticipant}
          onToggleVotes={toggleVotesVisibility}
          onResetVotes={resetVotes}
        />
      </div>
    </div>
  );
}
