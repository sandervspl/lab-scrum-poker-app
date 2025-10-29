'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRealtime } from '@/app/room/[roomId]/use-realtime';
import { Button } from '@/components/ui/button';
import { generateParticipantCookie, getParticipantCookie } from '@/lib/cookies';
import {
  participantsQueryOptions,
  roomQueryOptions,
  votesQueryOptions,
} from '@/lib/queries/room-queries';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';

import { CopyRoomLinkButton } from './copy-room-link-button';
import { JoinRoomForm } from './join-room-form';
import { ParticipantsList } from './participants-list';
import { PresentationModeToggle } from './presentation-mode-toggle';
import { PresentationSidebar } from './presentation-sidebar';
import { RoomHeader } from './room-header';
import { RoomName } from './room-name';
import { VotingCards } from './voting-cards';

type Props = {
  roomId: string;
  participantId: string | undefined;
};

export function RoomClient({ roomId, participantId }: Props) {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPresentationMode = searchParams.get('mode') === 'presentation';

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

  // Race condition: middleware might not have set the participant ID cookie yet
  if (!participantId && getParticipantCookie(Cookies) == null) {
    generateParticipantCookie();
    router.refresh();
    return null;
  }

  // Subscribe to room updates
  useRealtime(roomId);

  // Toggle body class to hide global header in presentation mode
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('presentation-mode-room', isPresentationMode);

      return () => {
        document.body.classList.remove('presentation-mode-room');
      };
    }
  }, [isPresentationMode]);

  // Show name form if first time joining room
  if (!participants.data.some((p) => p.participant_id === participantId)) {
    return <JoinRoomForm roomId={roomId} room={room.data} isAdmin={isAdmin} />;
  }

  if (isPresentationMode) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-8">
        <RoomHeader room={room.data} isAdmin={isAdmin} />
        <div className="grid gap-6 md:grid-cols-12">
          <PresentationSidebar />
          <div className="space-y-6 md:col-span-7 lg:col-span-9">
            <ParticipantsList
              participants={participants.data ?? []}
              votes={votes.data ?? []}
              room={room.data}
              userId={participantId!}
              isAdmin={isAdmin}
              presentationMode
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full py-2">
        <div className="container mx-auto flex items-center justify-between px-4">
          <RoomName room={room.data} isAdmin={isAdmin} variant="small" />
          <CopyRoomLinkButton />
        </div>
      </div>
      <div className="from-background via-background to-muted/20 min-h[calc(100vh-3.5rem)] container mx-auto bg-gradient-to-br px-4 py-8">
        <div className="space-y-6">
          <PresentationModeToggle className="justify-end" />
          <VotingCards participantId={participantId!} />
          <ParticipantsList
            participants={participants.data ?? []}
            votes={votes.data ?? []}
            room={room.data}
            userId={participantId!}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </>
  );
}
