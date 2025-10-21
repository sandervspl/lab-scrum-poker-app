'use client';

import { Button } from '@/components/ui/button';
import { useViewVotes } from '@/lib/hooks/use-view-votes';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

export function ViewVotesButton({ className }: { className?: string }) {
  const { viewVotes, isRevealed } = useViewVotes();

  return (
    <Button size="sm" className={className} onClick={viewVotes}>
      {isRevealed ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      {isRevealed ? 'Hide votes' : 'Show votes'}
    </Button>
  );
}
