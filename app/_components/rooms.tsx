import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PARTICIPANT_COOKIE, ROOMS_COOKIE } from '@/lib/cookies';
import { getRoomHistory } from '@/lib/room-history';
import { ClockIcon, Users } from 'lucide-react';

import { RoomCard } from './room-card';

export async function Rooms(): Promise<ReactNode> {
  const cookieStore = await cookies();
  const rooms = getRoomHistory(
    cookieStore.get(ROOMS_COOKIE)?.value,
    cookieStore.get(PARTICIPANT_COOKIE)?.value,
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
            <Users className="mb-3 h-10 w-10" />
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
