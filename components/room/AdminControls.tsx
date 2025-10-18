'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Room } from '@/types';
import { Eye, EyeOff } from 'lucide-react';

interface AdminControlsProps {
  room: Room | undefined;
  averageVote: string | null;
  onToggleVotes: () => void;
  onResetVotes: () => void;
}

export function AdminControls({
  room,
  averageVote,
  onToggleVotes,
  onResetVotes,
}: AdminControlsProps) {
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleResetVotes = () => {
    onResetVotes();
    setShowResetDialog(false);
  };

  return (
    <div className="flex items-center gap-3">
      {room?.votes_revealed && averageVote && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Average:</span>
          <Badge variant="default" className="px-3 py-1 text-lg font-bold">
            {averageVote}
          </Badge>
        </div>
      )}
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
            <AlertDialogAction onClick={handleResetVotes}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button onClick={onToggleVotes} variant="outline" size="sm">
        {room?.votes_revealed ? (
          <>
            <EyeOff className="mr-2 h-4 w-4" />
            Hide Votes
          </>
        ) : (
          <>
            <Eye className="mr-2 h-4 w-4" />
            Show Votes
          </>
        )}
      </Button>
    </div>
  );
}
