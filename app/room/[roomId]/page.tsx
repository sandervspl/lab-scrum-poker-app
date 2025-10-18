import { Suspense } from 'react';
import { RoomClient } from '@/components/room/RoomClient';
import { getSupabaseServerClient } from '@/lib/supabase/server';

interface RoomPageProps {
  params: { roomId: string };
  searchParams: { admin?: string };
}

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { roomId } = params;
  const supabase = await getSupabaseServerClient();

  // Fetch initial data server-side
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (roomError || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Room not found</p>
      </div>
    );
  }

  const [{ data: participantsData }, { data: votesData }] = await Promise.all([
    supabase
      .from('participants')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true }),
    supabase.from('votes').select('*').eq('room_id', roomId),
  ]);

  const participants = participantsData || [];
  const votes = votesData || [];
  const adminIdFromQuery = searchParams.admin || null;

  return (
    <RoomClient
      roomId={roomId}
      initialRoom={room}
      initialParticipants={participants}
      initialVotes={votes}
      adminIdFromQuery={adminIdFromQuery}
    />
  );
}
