'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateRoomNameInHistory } from '@/lib/room-history';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { Check, Copy, PencilIcon } from 'lucide-react';

type Props = {
  room: Database['public']['Tables']['rooms']['Row'] | null;
  roomId: string;
  isAdmin: boolean;
};

export function RoomHeader({ room, roomId, isAdmin }: Props) {
  const [copied, setCopied] = useState(false);
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [editedRoomName, setEditedRoomName] = useState(room?.room_name || '');
  const supabase = getSupabaseBrowserClient();

  function copyRoomLink() {
    const url = window.location.origin + `/room/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-2">
        {isEditingRoomName ? null : (
          <h1 className="text-3xl font-bold tracking-tight">{room?.room_name || 'Scrum Poker'}</h1>
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
              className="h-7 max-w-xs text-sm"
            />
          ) : null}
          {isAdmin && !isEditingRoomName && (
            <Button
              onClick={startEditingRoomName}
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              aria-label="Edit room name"
              variant="ghost"
            >
              <PencilIcon className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={copyRoomLink}>
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
        {isAdmin && <Badge variant="secondary">Admin</Badge>}
      </div>
    </div>
  );
}
