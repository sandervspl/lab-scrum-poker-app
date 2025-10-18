'use client';

import { useRouter } from 'next/navigation';
import { useRealtime } from '@/app/room/[roomId]/use-realtime';
import { Button } from '@/components/ui/button';
import {
  participantsQueryOptions,
  roomQueryOptions,
  votesQueryOptions,
} from '@/lib/queries/room-queries';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSuspenseQuery } from '@tanstack/react-query';

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
  const router = useRouter();

  const { data: room } = useSuspenseQuery(roomQueryOptions(supabase, roomId));
  const { data: participants } = useSuspenseQuery(participantsQueryOptions(supabase, roomId));
  const { data: votes } = useSuspenseQuery(votesQueryOptions(supabase, roomId));

  const isAdmin = participantId === room.data?.admin_id;

  if (!room.data || !participants.data || !votes.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-2xl font-bold">Oops, something went wrong</p>
        <Button onClick={() => router.refresh()}>Reload page</Button>
      </div>
    );
  }

  // Subscribe to room updates
  useRealtime(roomId);

  // Show name form if first time joining room
  if (!participants.data.some((p) => p.participant_id === participantId)) {
    return (
      <JoinRoomForm
        roomId={roomId}
        room={room.data}
        isAdmin={isAdmin}
        currentParticipantId={participantId}
      />
    );
  }

  return (
    <div className="from-background via-background to-muted/20 min-h-[calc(100vh-3.5rem)] bg-gradient-to-br p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <RoomHeader room={room.data} roomId={roomId} isAdmin={isAdmin} />
        <VotingCards participantId={participantId} />
        <ParticipantsList
          participants={participants.data ?? []}
          votes={votes.data ?? []}
          room={room.data}
          userId={participantId}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
