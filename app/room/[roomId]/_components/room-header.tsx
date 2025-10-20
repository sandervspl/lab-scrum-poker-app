'use client';

import { Database } from '@/lib/supabase/database.types';

import { CopyRoomLinkButton } from './copy-room-link-button';
import { RoomName } from './room-name';

type Props = {
  room: Database['public']['Tables']['rooms']['Row'] | null;
  isAdmin: boolean;
};

export function RoomHeader({ room, isAdmin }: Props) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <RoomName room={room} isAdmin={isAdmin} />
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <CopyRoomLinkButton />
        </div>
      </div>
    </div>
  );
}
