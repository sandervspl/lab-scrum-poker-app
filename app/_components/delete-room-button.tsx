'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { removeRoomFromHistory } from '@/lib/room-history';
import { Trash2Icon } from 'lucide-react';

export function DeleteRoomButton({ roomId }: { roomId: string }) {
  const router = useRouter();

  function handleDeleteRoom(roomId: string, e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    removeRoomFromHistory(roomId);
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
      onClick={(e) => {
        e.preventDefault();
        return handleDeleteRoom(roomId, e);
      }}
    >
      <Trash2Icon className="text-muted-foreground hover:text-destructive h-4 w-4" />
    </Button>
  );
}
