'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addRoomToHistory } from '@/lib/room-history';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

type Props = {
  roomId: string;
  room: Database['public']['Tables']['rooms']['Row'] | null;
  isAdmin: boolean;
  currentParticipantId: string | null;
  onJoined: (participantId: string) => void;
};

export function JoinRoomForm({ roomId, room, isAdmin, currentParticipantId, onJoined }: Props) {
  const [name, setName] = useState('');
  const supabase = getSupabaseBrowserClient();

  async function joinRoom() {
    if (!name.trim()) return;

    const participantId = currentParticipantId || crypto.randomUUID();

    const { error } = await supabase.from('participants').upsert(
      {
        room_id: roomId,
        name: name.trim(),
        participant_id: participantId,
      },
      {
        onConflict: 'room_id,participant_id',
      },
    );

    if (error) {
      console.error('[v0] Error joining room:', error);
      alert('Failed to join room');
      return;
    }

    addRoomToHistory(roomId, isAdmin, participantId, name.trim(), room?.room_name || undefined);
    onJoined(participantId);
  }

  return (
    <div className="from-background via-background to-muted/20 flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
            />
          </div>
          <Button onClick={joinRoom} disabled={!name.trim()} className="w-full">
            Join Room
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
