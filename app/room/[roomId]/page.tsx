import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { RoomClient } from '@/components/room/RoomClient';
import { getParticipants, getRoom, getVotes } from '@/lib/queries/room-db';
import { roomQueryOptions } from '@/lib/queries/room-queries';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { prefetchQuery } from '@supabase-cache-helpers/postgrest-react-query';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ admin?: string }>;
}

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { roomId } = await params;
  const { admin } = await searchParams;
  const cookieStore = await cookies();
  const supabase = getSupabaseServerClient(cookieStore);
  const queryClient = new QueryClient();

  // Fetch initial data server-side
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
        <RoomClient roomId={roomId} adminIdFromQuery={admin} />
      </Suspense>
    </HydrationBoundary>
  );
}
