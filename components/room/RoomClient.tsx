'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  useParticipantCheckQuery,
  useParticipantsQuery,
  useRoomQuery,
  useVotesQuery,
} from '@/lib/queries/room-queries';
import { allVotesMatch, calculateAverage, randomInRange } from '@/lib/room-utils';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';

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

  const { data: room } = useRoomQuery(roomId);
  const { data: participants = [] } = useParticipantsQuery(roomId);
  const { data: votes = [] } = useVotesQuery(roomId);

  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const hasCheckedJoined = useRef(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Check if participant has joined
  const { data: participantData } = useParticipantCheckQuery(
    roomId,
    currentParticipantId ?? '',
    !!currentParticipantId && !hasCheckedJoined.current,
  );

  // Initialize participant ID from query param or localStorage
  useEffect(() => {
    if (adminIdFromQuery) {
      setIsAdmin(true);
      setCurrentParticipantId(adminIdFromQuery);
      localStorage.setItem(`participant_${roomId}`, adminIdFromQuery);
      localStorage.setItem(`admin_${roomId}`, 'true');
    } else {
      const storedId = localStorage.getItem(`participant_${roomId}`);
      if (storedId) {
        setCurrentParticipantId(storedId);
      }
    }
  }, [roomId, adminIdFromQuery]);

  // Handle participant check result
  useEffect(() => {
    if (!currentParticipantId || hasCheckedJoined.current) return;

    if (participantData) {
      setHasJoined(true);
    } else if (participantData === null) {
      setHasJoined(false);
    }

    if (room && room.admin_id === currentParticipantId) {
      setIsAdmin(true);
      localStorage.setItem(`admin_${roomId}`, 'true');
    }

    hasCheckedJoined.current = true;
  }, [participantData, currentParticipantId, room, roomId]);

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
            queryClient.invalidateQueries({ queryKey: ['room', roomId] });
            queryClient.invalidateQueries({ queryKey: ['votes', roomId] });
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('[v0] Participants changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['participants', roomId] });
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('[v0] Vote inserted:', payload);
          queryClient.invalidateQueries({ queryKey: ['votes', roomId] });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('[v0] Vote updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['votes', roomId] });
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('[v0] Vote deleted:', payload);
          queryClient.invalidateQueries({ queryKey: ['votes', roomId] });
        },
      )
      .subscribe();

    return channel;
  });

  useEffect(() => {
    const channel = subscribeToEvents();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const handleJoined = (participantId: string) => {
    setCurrentParticipantId(participantId);
    setHasJoined(true);
    queryClient.invalidateQueries({ queryKey: ['participants', roomId] });
    queryClient.invalidateQueries({ queryKey: ['votes', roomId] });
  };

  const castVote = async (value: string) => {
    if (!currentParticipantId) {
      console.log('[v0] Cannot cast vote: no participant ID');
      return;
    }

    console.log('[v0] Casting vote:', { roomId, participantId: currentParticipantId, value });

    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('room_id', roomId)
      .eq('participant_id', currentParticipantId)
      .single();

    if (existingVote) {
      console.log('[v0] Updating existing vote');
      const { error } = await supabase
        .from('votes')
        .update({ vote_value: value })
        .eq('room_id', roomId)
        .eq('participant_id', currentParticipantId);

      if (error) {
        console.error('[v0] Error updating vote:', error);
      } else {
        console.log('[v0] Vote updated successfully');
        queryClient.invalidateQueries({ queryKey: ['votes', roomId] });
      }
    } else {
      console.log('[v0] Inserting new vote');
      const { error } = await supabase.from('votes').insert({
        room_id: roomId,
        participant_id: currentParticipantId,
        vote_value: value,
      });

      if (error) {
        console.error('[v0] Error inserting vote:', error);
      } else {
        console.log('[v0] Vote inserted successfully');
        queryClient.invalidateQueries({ queryKey: ['votes', roomId] });
      }
    }
  };

  const toggleVotesVisibility = async () => {
    const newValue = !room?.votes_revealed;

    const { error } = await supabase
      .from('rooms')
      .update({ votes_revealed: newValue })
      .eq('id', roomId);

    if (error) {
      console.error('[v0] Error toggling votes visibility:', error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['room', roomId] });
    if (newValue && !hasCelebrated && allVotesMatch(votes, participants)) {
      shootConfetti();
      setHasCelebrated(true);
    }
  };

  const resetVotes = async () => {
    console.log('[v0] Resetting votes');
    const { error: votesError } = await supabase.from('votes').delete().eq('room_id', roomId);

    if (votesError) {
      console.error('[v0] Error deleting votes:', votesError);
      return;
    }

    console.log('[v0] Votes deleted successfully');

    await supabase.from('rooms').update({ votes_revealed: false }).eq('id', roomId);

    queryClient.invalidateQueries({ queryKey: ['votes', roomId] });
    queryClient.invalidateQueries({ queryKey: ['room', roomId] });
    setHasCelebrated(false);
  };

  const removeParticipant = async (participantId: string) => {
    if (!isAdmin) return;

    // Prevent admin from removing themselves
    if (participantId === currentParticipantId) {
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
    queryClient.invalidateQueries({ queryKey: ['participants', roomId] });
    queryClient.invalidateQueries({ queryKey: ['votes', roomId] });
  };

  const currentVote = votes.find((v) => v.participant_id === currentParticipantId);
  const averageVote = calculateAverage(votes);

  if (!hasCheckedJoined.current) {
    return null;
  }

  if (hasCheckedJoined.current && !hasJoined) {
    return (
      <JoinRoomForm
        roomId={roomId}
        room={room}
        isAdmin={isAdmin}
        currentParticipantId={currentParticipantId}
        onJoined={handleJoined}
      />
    );
  }

  return (
    <div className="from-background via-background to-muted/20 min-h-[calc(100vh-3.5rem)] bg-gradient-to-br p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <RoomHeader room={room} roomId={roomId} isAdmin={isAdmin} />

        {/* Voting Cards */}
        <VotingCards currentVote={currentVote} onCastVote={castVote} />

        {/* Participants and Votes */}
        <ParticipantsList
          participants={participants}
          votes={votes}
          room={room}
          currentParticipantId={currentParticipantId}
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
