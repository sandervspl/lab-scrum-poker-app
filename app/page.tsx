'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  addRoomToHistory,
  getRoomHistory,
  removeRoomFromHistory,
  type RoomHistoryItem,
} from '@/lib/room-history';
import { Clock, Crown, Loader2, Trash2 } from 'lucide-react';

export default function HomePage() {
  const [isCreating, setIsCreating] = useState(false);
  const [roomHistory, setRoomHistory] = useState<RoomHistoryItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    setRoomHistory(getRoomHistory());
  }, []);

  const createRoom = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const data = await response.json();

      addRoomToHistory(data.roomId, true);

      router.push(`/room/${data.roomId}?admin=${data.adminId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRoom = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRoomFromHistory(roomId);
    setRoomHistory(getRoomHistory());
  };

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
            <Button
              onClick={createRoom}
              disabled={isCreating}
              className="h-12 w-full text-base font-medium"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Room...
                </>
              ) : (
                'Create New Room'
              )}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Create a room and share the link with your team to start voting
            </p>
          </CardContent>
        </Card>

        {roomHistory.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="h-5 w-5" />
                Recent Rooms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roomHistory.map((room) => (
                  <Link
                    key={room.roomId}
                    href={`/room/${room.roomId}`}
                    className="bg-card hover:bg-accent hover:border-primary/50 group flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                        {room.isAdmin ? (
                          <Crown className="text-primary h-5 w-5" />
                        ) : (
                          <span className="text-primary text-sm font-semibold">
                            {room.participantName?.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-sm">{room.roomName || room.roomId}</p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(room.lastJoined).toLocaleDateString()} at{' '}
                          {new Date(room.lastJoined).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {room.isAdmin && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => handleDeleteRoom(room.roomId, e)}
                      >
                        <Trash2 className="text-muted-foreground hover:text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
