'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { PresentationModeToggle } from './presentation-mode-toggle';
import { ResetVotesButton } from './reset-votes-button';
import { ViewVotesButton } from './view-votes-button';

export function PresentationSidebar() {
  return (
    <aside className="md:col-span-5 lg:col-span-3">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <ViewVotesButton className="w-full" />
          <ResetVotesButton className="w-full" />
          <hr className="my-4" />
          <PresentationModeToggle className="justify-between" />
        </CardContent>
      </Card>
    </aside>
  );
}
