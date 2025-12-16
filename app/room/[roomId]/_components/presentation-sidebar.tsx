'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from '@/lib/supabase/database.types';

import { PresentationModeToggle } from './presentation-mode-toggle';
import { ResetVotesButton } from './reset-votes-button';
import { SettingsModal } from './settings-modal';
import { ViewVotesButton } from './view-votes-button';

type Props = {
  room: Database['public']['Tables']['rooms']['Row'];
  isAdmin: boolean;
};

export function PresentationSidebar({ room, isAdmin }: Props) {
  return (
    <aside className="md:col-span-5 lg:col-span-3">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <ViewVotesButton className="w-full" />
          <ResetVotesButton className="w-full" />
          {isAdmin && <SettingsModal room={room} showLabel />}
          <hr className="my-4" />
          <PresentationModeToggle className="justify-between" />
        </CardContent>
      </Card>
    </aside>
  );
}
