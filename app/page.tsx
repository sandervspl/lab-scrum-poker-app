import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { CreateRoomButton } from './_components/create-room-button';
import { Rooms, RoomsSkeleton } from './_components/rooms';

export default async function HomePage() {
  return (
    <main className="from-background via-background to-muted/20 mt-8 flex min-h-[calc(100vh-3.5rem)] justify-center bg-linear-to-br p-4 shadow-none">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="border-none bg-transparent shadow-none">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold tracking-tight">Scrum Poker</CardTitle>
            <CardDescription className="text-base">
              Estimate story points with your team in real-time
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CreateRoomButton />
          </CardContent>
        </Card>

        <Suspense fallback={<RoomsSkeleton />}>
          <Rooms />
        </Suspense>
      </div>
    </main>
  );
}
