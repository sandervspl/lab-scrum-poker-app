import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { RoomClient } from '@/app/room/[roomId]/_components/room-client';
import { PARTICIPANT_COOKIE } from '@/lib/cookies';
import { roomQueryOptions } from '@/lib/queries/room-queries';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';

import { RoomProvider } from './_components/context';

type Props = {
  params: Promise<{ roomId: string }>;
};

export default async function RoomPage({ params }: Props) {
  const { roomId } = await params;
  const cookieStore = await cookies();
  const supabase = getSupabaseServerClient(cookieStore);
  const queryClient = new QueryClient();
  const participantId = cookieStore.get(PARTICIPANT_COOKIE)?.value;

  const { data: room, error: roomError } = await queryClient.ensureQueryData(
    roomQueryOptions(supabase, roomId),
  );

  if (roomError || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Room not found</p>
      </div>
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <Loader2Icon className="animate-spin" />
          </div>
        }
      >
        <RoomProvider>
          <RoomClient roomId={roomId} participantId={participantId} />
        </RoomProvider>
      </Suspense>
    </HydrationBoundary>
  );
}
