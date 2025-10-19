'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PARTICIPANT_COOKIE } from '@/lib/cookies';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useMutation } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { Loader2Icon, Trash2Icon } from 'lucide-react';

export function RemoveParticipantButton({ participantId }: { participantId: string }) {
  const { roomId } = useParams<{ roomId: string }>();
  const supabase = getSupabaseBrowserClient();
  const userId = Cookies.get(PARTICIPANT_COOKIE)!;

  const removeParticipant = useMutation({
    mutationFn: async (participantIdToRemove: string) => {
      // Prevent admin from removing themselves
      if (participantIdToRemove === userId) {
        alert('You cannot remove yourself from the room');
        return;
      }

      const confirmRemove = confirm('Are you sure you want to remove this participant?');
      if (!confirmRemove) return;

      console.log('Removing participant:', participantId);

      // Delete participant's votes first
      const { error: votesError } = await supabase
        .from('votes')
        .delete()
        .eq('room_id', roomId)
        .eq('participant_id', participantId);

      if (votesError) {
        console.error('Error deleting participant votes:', votesError);
      }

      // Delete participant
      const { error: participantError } = await supabase
        .from('participants')
        .delete()
        .eq('room_id', roomId)
        .eq('participant_id', participantId);

      if (participantError) {
        console.error('Error removing participant:', participantError);
        alert('Failed to remove participant');
        return;
      }
    },
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive size-8"
      onClick={() => removeParticipant.mutateAsync(participantId)}
      disabled={removeParticipant.isPending}
    >
      {removeParticipant.isPending ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <Trash2Icon className="size-4" />
      )}
    </Button>
  );
}
