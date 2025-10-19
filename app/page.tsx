import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { CreateRoomButton } from './_components/create-room-button';
import { Rooms } from './_components/rooms';

export default function HomePage() {
  return (
    <div className="from-background via-background to-muted/20 flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-4xl font-bold tracking-tight">Scrum Poker</CardTitle>
            <CardDescription className="text-base">
              Estimate story points with your team in real-time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CreateRoomButton />
            <p className="text-muted-foreground text-center text-sm">
              Create a room and share the link with your team to start voting
            </p>
          </CardContent>
        </Card>

        {/* @ts-ignore */}
        <Rooms />
      </div>
    </div>
  );
}
