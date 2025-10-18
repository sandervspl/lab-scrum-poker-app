'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PARTICIPANT_COOKIE } from '@/lib/cookies';
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
      const participantId = Cookies.get(PARTICIPANT_COOKIE)!;

      const { data: room, error } = await supabase
        .from('rooms')
        .insert({
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
        addRoomToHistory(room.id, true);
        router.push(`/room/${room.id}`);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleCreateRoom}
        disabled={isLoading}
        className="h-12 w-full text-base font-medium"
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
