'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateRoomNameInHistory } from '@/lib/room-history';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';
import { PencilIcon } from 'lucide-react';

type Props = {
  room: Database['public']['Tables']['rooms']['Row'] | null;
  isAdmin: boolean;
  variant?: 'small' | 'large';
};

export function RoomName({ room, isAdmin, variant = 'large' }: Props) {
  const supabase = getSupabaseBrowserClient();
  const { roomId } = useParams<{ roomId: string }>();
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [editedRoomName, setEditedRoomName] = useState(room?.room_name || '');

  async function updateRoomName() {
    if (!editedRoomName.trim() || editedRoomName === room?.room_name) {
      setIsEditingRoomName(false);
      return;
    }

    const { data, error } = await supabase
      .from('rooms')
      .update({ room_name: editedRoomName.trim() })
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      console.error('[v0] Error updating room name:', error);
      alert('Failed to update room name');
    } else if (data) {
      updateRoomNameInHistory(roomId, editedRoomName.trim());
    }

    setIsEditingRoomName(false);
  }

  function startEditingRoomName() {
    setEditedRoomName(room?.room_name || `Room ${roomId.slice(0, 8)}`);
    setIsEditingRoomName(true);
  }

  return (
    <div className="flex flex-1 items-center gap-2">
      {isEditingRoomName ? null : (
        <h1 className={cn('text-3xl font-bold tracking-tight', variant === 'small' && 'text-lg')}>
          {room?.room_name || 'Scrum Poker'}
        </h1>
      )}
      <div className="mt-1 flex items-center gap-2">
        {isEditingRoomName ? (
          <Input
            value={editedRoomName}
            onChange={(e) => setEditedRoomName(e.target.value)}
            onBlur={updateRoomName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateRoomName();
              } else if (e.key === 'Escape') {
                setIsEditingRoomName(false);
              }
            }}
            autoFocus
            className="h-7 w-full max-w-3xl text-sm"
          />
        ) : null}
        {isAdmin && !isEditingRoomName && (
          <Button
            onClick={startEditingRoomName}
            type="button"
            className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            aria-label="Edit room name"
            variant="ghost"
            size={variant === 'small' ? 'sm' : undefined}
          >
            <PencilIcon className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
