'use client';

import { useContext, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { resetVotesOfRoom } from '@/lib/queries/room-db';
import { roomQueryOptions, votesQueryOptions } from '@/lib/queries/room-queries';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

import { useRoomContext } from './context';

export function ResetVotesButton() {
  const { roomId } = useParams<{ roomId: string }>();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const queryClient = useQueryClient();
  const { setHasCelebrated } = useRoomContext();

  async function resetVotes() {
    const supabase = getSupabaseBrowserClient();
    const [{ error: votesError }, { error: roomError }] = await resetVotesOfRoom(supabase, roomId);

    if (votesError || roomError) {
      console.error('Error deleting votes:', votesError?.message || roomError?.message);
      return;
    }

    setHasCelebrated(false);

    await Promise.all([
      queryClient.invalidateQueries(votesQueryOptions(supabase, roomId)),
      queryClient.invalidateQueries(roomQueryOptions(supabase, roomId)),
    ]);
  }

  return (
    <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          Reset Votes
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset all votes?</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear all votes and hide them. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={resetVotes}>Reset</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
