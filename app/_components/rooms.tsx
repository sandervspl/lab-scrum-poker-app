import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getParticipantCookie, getRoomsCookie } from '@/lib/cookies';
import { getRoomHistory } from '@/lib/room-history';
import { ClockIcon, UsersIcon } from 'lucide-react';

import { RoomCard, RoomCardSkeleton } from './room-card';

export async function Rooms(): Promise<ReactNode> {
  const cookieStore = await cookies();
  const rooms = getRoomHistory(
    getRoomsCookie(cookieStore)?.value,
    getParticipantCookie(cookieStore)?.value,
  );

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ClockIcon className="h-5 w-5" />
          Recent Rooms
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rooms.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-10 text-center">
            <UsersIcon className="mb-3 size-10" />
            <div className="text-foreground mb-1 font-medium">No rooms yet</div>
            <p className="text-sm">
              You can join rooms by visiting a link that the room admin shares.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => (
              <RoomCard key={room.roomId} room={room} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RoomsSkeleton() {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ClockIcon className="h-5 w-5" />
          Recent Rooms
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <RoomCardSkeleton key={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
