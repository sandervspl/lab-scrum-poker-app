'use client';

import { useState } from 'react';
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
import { resetVotesOfRoom, updateVotingMode } from '@/lib/queries/room-db';
import { roomQueryOptions, votesQueryOptions } from '@/lib/queries/room-queries';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { TSHIRT_DEFAULT_DEFINITIONS, VotingMode } from '@/types';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { HashIcon, ShirtIcon } from 'lucide-react';

import { useRoomContext } from './context';

type Props = {
  room: Database['public']['Tables']['rooms']['Row'];
  className?: string;
};

export function VotingModeToggle({ room, className }: Props) {
  const { roomId } = useParams<{ roomId: string }>();
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const { data: votes } = useSuspenseQuery(votesQueryOptions(supabase, roomId));
  const { setHasCelebrated } = useRoomContext();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingMode, setPendingMode] = useState<VotingMode | null>(null);
  const hasVotes = (votes.data?.length ?? 0) > 0;

  async function changeVotingMode(newMode: VotingMode) {
    if (hasVotes) {
      // Clear votes when changing mode
      await resetVotesOfRoom(supabase, roomId);
      setHasCelebrated(false);
    }

    await updateVotingMode(supabase, roomId, newMode);
    await queryClient.invalidateQueries(roomQueryOptions(supabase, roomId));
    await queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
    setShowDialog(false);
    setPendingMode(null);
  }

  function handleModeSwitch(newMode: VotingMode) {
    if (hasVotes) {
      setPendingMode(newMode);
      setShowDialog(true);
    } else {
      changeVotingMode(newMode);
    }
  }

  return (
    <>
      <div className={className}>
        <div className="bg-muted inline-flex items-center gap-1 rounded-lg p-1">
          <Button
            variant={room.voting_mode === 'fibonacci' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleModeSwitch('fibonacci')}
            className="h-7 gap-1.5 px-2.5 text-xs"
            title="Fibonacci (0, 1, 2, 3, 5, 8, 13, 21)"
          >
            <HashIcon className="size-3.5" />
            <span className="hidden sm:inline">Fibonacci</span>
          </Button>
          <Button
            variant={room.voting_mode === 'tshirt' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleModeSwitch('tshirt')}
            className="h-7 gap-1.5 px-2.5 text-xs"
            title="T-Shirt Sizing (XS, S, M, L, XL, XXL)"
          >
            <ShirtIcon className="size-3.5" />
            <span className="hidden sm:inline">T-Shirt</span>
          </Button>
        </div>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change voting mode?</AlertDialogTitle>
            <AlertDialogDescription>
              Switching to {pendingMode === 'tshirt' ? 'T-Shirt sizing' : 'Fibonacci'} will reset
              all current votes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingMode === 'tshirt' && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground mb-2 text-sm font-medium">T-Shirt Size Guide:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {Object.entries(TSHIRT_DEFAULT_DEFINITIONS).map(([size, definition]) => (
                  <div key={size} className="flex justify-between">
                    <span className="font-semibold">{size}</span>
                    <span className="text-muted-foreground">{definition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingMode(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingMode && changeVotingMode(pendingMode)}>
              Switch Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
