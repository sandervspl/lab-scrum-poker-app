'use client';

import { Button } from '@/components/ui/button';
import { useViewVotes } from '@/lib/hooks/use-view-votes';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

export function ViewVotesButton() {
  const { viewVotes, isRevealed } = useViewVotes();

  return (
    <Button onClick={viewVotes} variant="outline" size="sm">
      {isRevealed ? (
        <>
          <EyeOffIcon className="mr-2 size-4" />
          Hide Votes
        </>
      ) : (
        <>
          <EyeIcon className="mr-2 size-4" />
          Show Votes
        </>
      )}
    </Button>
  );
}
