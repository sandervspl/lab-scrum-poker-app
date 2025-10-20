'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useViewVotes } from '@/lib/hooks/use-view-votes';
import { EyeIcon } from 'lucide-react';

import { PresentationModeToggle } from './presentation-mode-toggle';
import { ResetVotesButton } from './reset-votes-button';

export function PresentationSidebar() {
  const { viewVotes, isRevealed } = useViewVotes();

  return (
    <aside className="md:col-span-5 lg:col-span-3">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="reveal-votes" className="text-sm">
              <EyeIcon className="size-4" />
              Show votes
            </Label>
            <Switch id="reveal-votes" checked={isRevealed} onCheckedChange={viewVotes} />
          </div>
          <ResetVotesButton className="w-full" />
          <hr className="my-2" />
          <PresentationModeToggle className="justify-between" />
        </CardContent>
      </Card>
    </aside>
  );
}
