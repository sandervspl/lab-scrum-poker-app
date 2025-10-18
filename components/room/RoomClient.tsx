'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  participantQueryOptions,
  participantsQueryOptions,
  roomQueryOptions,
  votesQueryOptions,
} from '@/lib/queries/room-queries';
import { allVotesMatch, calculateAverage, randomInRange } from '@/lib/room-utils';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import confetti from 'canvas-confetti';

// TODO: Move to a shared component
import Loader from '../../app/room/[roomId]/loading';
import { JoinRoomForm } from './JoinRoomForm';
import { ParticipantsList } from './ParticipantsList';
import { RoomHeader } from './RoomHeader';
import { VotingCards } from './VotingCards';

interface RoomClientProps {
  roomId: string;
  adminIdFromQuery: string | undefined;
}

export function RoomClient({ roomId, adminIdFromQuery }: RoomClientProps) {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  const { data: room } = useSuspenseQuery(roomQueryOptions(supabase, roomId));
  const { data: participants } = useSuspenseQuery(participantsQueryOptions(supabase, roomId));
  const { data: votes } = useSuspenseQuery(votesQueryOptions(supabase, roomId));

  const [participantIdStorage, setParticipantIdStorage] = useState<string | null>(null);
  const [hasJoinedBefore, setHasJoinedBefore] = useState<boolean | null>(null);
  const [hasCheckedJoinedBefore, setHasCheckedJoinedBefore] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Get participant data
  const { data: participant } = useQuery(
    participantQueryOptions(supabase, roomId, participantIdStorage),
  );

  // Admin check
  if (
    participant?.data?.id &&
    room.data?.admin_id &&
    participant.data.id === room.data.admin_id &&
    !isAdmin
  ) {
    setIsAdmin(true);
  }

  // Has joined before check
  if (hasJoinedBefore === null) {
    if (participantIdStorage) {
      setHasJoinedBefore(true);
    } else if (hasCheckedJoinedBefore) {
      setHasJoinedBefore(false);
    }
  }

  // Subscribe to realtime changes
  const subscribeToEvents = useEffectEvent(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload: any) => {
          console.log('[v0] Room updated:', payload);
          if (payload.new) {
            queryClient.invalidateQueries(roomQueryOptions(supabase, roomId));
            queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('[v0] Participants changed:', payload);
          queryClient.invalidateQueries(participantsQueryOptions(supabase, roomId));
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('[v0] Vote inserted:', payload);
          queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('[v0] Vote updated:', payload);
          queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('[v0] Vote deleted:', payload);
          queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
        },
      )
      .subscribe();

    return channel;
  });

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = subscribeToEvents();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Set participant ID from query param or localStorage
  useEffect(() => {
    if (adminIdFromQuery) {
      setParticipantIdStorage(adminIdFromQuery);
      localStorage.setItem(`participant_${roomId}`, adminIdFromQuery);
      // localStorage.setItem(`admin_${roomId}`, 'true');
    } else {
      const storedId = localStorage.getItem(`participant_${roomId}`);
      if (storedId) {
        setParticipantIdStorage(storedId);
      }
    }

    setHasCheckedJoinedBefore(true);
  }, [roomId, adminIdFromQuery]);

  // Handle is admin check
  // useEffect(() => {
  //   if (participantIdStorage) {
  //     return;
  //   }

  //   if (room.data?.admin_id === participantIdStorage) {
  //     setIsAdmin(true);
  //     localStorage.setItem(`admin_${roomId}`, 'true');
  //   }
  // }, [participantIdStorage, room.data?.admin_id, roomId]);

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

  function handleJoined(participantId: string) {
    setParticipantIdStorage(participantId);
    setHasJoinedBefore(true);

    // Refetch all room queries
    queryClient.invalidateQueries({ queryKey: ['room'] });
  }

  async function castVote(value: string) {
    if (!participantIdStorage) {
      console.log('[v0] Cannot cast vote: no participant ID');
      return;
    }

    console.log('[v0] Casting vote:', { roomId, participantId: participantIdStorage, value });

    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('room_id', roomId)
      .eq('participant_id', participantIdStorage)
      .single();

    if (existingVote) {
      console.log('[v0] Updating existing vote');
      const { error } = await supabase
        .from('votes')
        .update({ vote_value: value })
        .eq('room_id', roomId)
        .eq('participant_id', participantIdStorage);

      if (error) {
        console.error('[v0] Error updating vote:', error);
      } else {
        console.log('[v0] Vote updated successfully');
        queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
      }
    } else {
      console.log('[v0] Inserting new vote');
      const { error } = await supabase.from('votes').insert({
        room_id: roomId,
        participant_id: participantIdStorage,
        vote_value: value,
      });

      if (error) {
        console.error('[v0] Error inserting vote:', error);
      } else {
        console.log('[v0] Vote inserted successfully');
        queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
      }
    }
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

  async function removeParticipant(participantId: string) {
    if (!isAdmin) return;

    // Prevent admin from removing themselves
    if (participantId === participantIdStorage) {
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

  const currentVote = votes.data?.find((v) => v.participant_id === participantIdStorage);
  const averageVote = votes.data ? calculateAverage(votes.data) : null;

  if (!participantIdStorage && !hasCheckedJoinedBefore) {
    return <Loader />;
  }

  if (hasCheckedJoinedBefore && !hasJoinedBefore) {
    return (
      <JoinRoomForm
        roomId={roomId}
        room={room.data}
        isAdmin={isAdmin}
        currentParticipantId={participantIdStorage}
        onJoined={handleJoined}
      />
    );
  }

  return (
    <div className="from-background via-background to-muted/20 min-h-[calc(100vh-3.5rem)] bg-gradient-to-br p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <RoomHeader room={room.data} roomId={roomId} isAdmin={isAdmin} />

        {/* Voting Cards */}
        <VotingCards currentVote={currentVote} onCastVote={castVote} />

        {/* Participants and Votes */}
        <ParticipantsList
          participants={participants.data ?? []}
          votes={votes.data ?? []}
          room={room.data}
          currentParticipantId={participantIdStorage}
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
