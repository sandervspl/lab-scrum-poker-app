import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getRelativeLastJoinedDate } from '@/lib/date';
import { RoomHistoryItem } from '@/lib/room-history';
import { CrownIcon } from 'lucide-react';

import { DeleteRoomButton } from './delete-room-button';

export function RoomCard({ room }: { room: RoomHistoryItem }) {
  return (
    <Link
      key={room.roomId}
      href={`/room/${room.roomId}`}
      className="bg-card hover:border-primary group flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="bg-muted/80 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <span className="text-muted-foreground text-sm font-medium">
            {room.participantName?.charAt(0).toUpperCase() || '?'}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="flex items-center gap-2 truncate font-mono text-sm">
            {room.roomName || room.roomId}
            {room.isAdmin && <CrownIcon className="size-4 text-amber-500" />}
          </p>
          <p className="text-muted-foreground text-xs">
            {getRelativeLastJoinedDate(room.lastJoined)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <DeleteRoomButton roomId={room.roomId} />
      </div>
    </Link>
  );
}

export function RoomCardSkeleton() {
  return <div className="bg-muted h-[74px] animate-pulse rounded-lg" />;
}
