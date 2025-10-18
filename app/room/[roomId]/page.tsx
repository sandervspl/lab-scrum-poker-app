import { cookies } from 'next/headers';
import { RoomClient } from '@/components/room/RoomClient';
import { getParticipants, getRoom, getVotes } from '@/lib/queries/room-db';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { prefetchQuery } from '@supabase-cache-helpers/postgrest-react-query';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

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
  const { data: room, error: roomError } = await getRoom(supabase, roomId);

  if (roomError || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Room not found</p>
      </div>
    );
  }

  await Promise.all([
    prefetchQuery(queryClient, getRoom(supabase, roomId)),
    prefetchQuery(queryClient, getParticipants(supabase, roomId)),
    prefetchQuery(queryClient, getVotes(supabase, roomId)),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RoomClient roomId={roomId} adminIdFromQuery={admin} />
    </HydrationBoundary>
  );
}
