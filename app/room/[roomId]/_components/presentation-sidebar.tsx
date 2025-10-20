'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useViewVotes } from '@/lib/hooks/use-view-votes';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

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
        <CardContent className="flex flex-col gap-2">
          {/* <div className="flex items-center justify-between">
            <Label htmlFor="reveal-votes" className="text-sm"></Label>
            <Switch id="reveal-votes" checked={isRevealed} onCheckedChange={viewVotes} />
          </div> */}
          <Button size="sm" className="w-full" onClick={viewVotes}>
            {isRevealed ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            {isRevealed ? 'Hide votes' : 'Show votes'}
          </Button>
          <ResetVotesButton className="w-full" />
          <hr className="my-4" />
          <PresentationModeToggle className="justify-between" />
        </CardContent>
      </Card>
    </aside>
  );
}
