'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getParticipantCookie, PARTICIPANT_COOKIE } from '@/lib/cookies';
import { addRoomToHistory } from '@/lib/room-history';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useMutation } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { Loader2Icon } from 'lucide-react';

export function CreateRoomButton() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const createRoom = useMutation({
    mutationFn: async () => {
      const supabase = getSupabaseBrowserClient();
      const participantId = getParticipantCookie()!;

      const words = await fetch('https://random-word-api.herokuapp.com/word?number=3').then(
        (res) => res.json() as Promise<string[]>,
      );

      const { data: room, error } = await supabase
        .from('rooms')
        .insert({
          room_name: words.join('-'),
          admin_id: participantId,
          votes_revealed: false,
        })
        .select()
        .single();

      if (error) {
        setError(error.message);
      }

      return room;
    },
  });
  const isLoading = createRoom.isPending || createRoom.isSuccess;

  function handleCreateRoom() {
    createRoom.mutateAsync().then((room) => {
      if (room) {
        const participantId = getParticipantCookie()!;
        addRoomToHistory(room.id, true, participantId);
        router.push(`/room/${room.id}`);
      }
    });
  }

  return (
    <div>
      <Button
        onClick={handleCreateRoom}
        disabled={isLoading}
        className="mx-auto h-12 w-fit text-base font-medium"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2Icon className="mr-2 size-5 animate-spin" />
            Creating Room...
          </>
        ) : (
          'Create New Room'
        )}
      </Button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
