import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROOMS_COOKIE } from '@/lib/cookies';
import { getRoomHistory } from '@/lib/room-history';
import { ClockIcon } from 'lucide-react';

import { RoomCard } from './room-card';

export async function Rooms(): Promise<ReactNode> {
  const cookieStore = await cookies();
  const rooms = getRoomHistory(cookieStore.get(ROOMS_COOKIE)?.value);

  if (rooms.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ClockIcon className="h-5 w-5" />
          Recent Rooms
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rooms.map((room) => (
            <RoomCard key={room.roomId} room={room} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
