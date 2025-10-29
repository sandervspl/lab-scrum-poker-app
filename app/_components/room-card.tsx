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
        <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          {room.isAdmin ? (
            <CrownIcon className="text-primary h-5 w-5" />
          ) : (
            <span className="text-primary text-sm font-semibold">
              {room.participantName?.charAt(0).toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm">{room.roomName || room.roomId}</p>
          <p className="text-muted-foreground text-xs">
            {getRelativeLastJoinedDate(room.lastJoined)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {room.isAdmin && (
          <Badge variant="secondary" className="text-xs">
            Admin
          </Badge>
        )}
        <DeleteRoomButton roomId={room.roomId} />
      </div>
    </Link>
  );
}

export function RoomCardSkeleton() {
  return <div className="bg-muted h-[74px] animate-pulse rounded-lg" />;
}
