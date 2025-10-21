'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { participantsQueryOptions } from '@/lib/queries/room-queries';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { CheckIcon, PencilIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  participantId: string;
  currentName: string;
  roomId: string;
  userId: string | null;
};

export function ParticipantName({ participantId, currentName, roomId, userId }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    const trimmedName = newName.trim();

    // Client-side validation
    if (!trimmedName) {
      toast.error('Name is required');
      return;
    }

    if (trimmedName.length > 20) {
      toast.error('Name must be 20 characters or less');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('participants')
      .update({ name: trimmedName })
      .eq('room_id', roomId)
      .eq('participant_id', participantId);

    setIsSubmitting(false);

    if (error) {
      console.error('Error updating participant name:', error);
      if (error.message.includes('participants_name_length_check')) {
        toast.error('Name must be 20 characters or less');
      } else {
        toast.error('Failed to update name');
      }
      return;
    }

    toast.success('Name updated successfully');
    setIsEditing(false);
    queryClient.invalidateQueries(participantsQueryOptions(supabase, roomId));
  };

  const handleCancel = () => {
    setNewName(currentName);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <>
        <Name name={currentName} userId={userId} participantId={participantId} />
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => setIsEditing(true)}
          title="Edit name"
        >
          <PencilIcon className="size-3" />
        </Button>
      </>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        className="h-7 w-32 text-sm"
        maxLength={20}
        autoFocus
        disabled={isSubmitting}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSave();
          } else if (e.key === 'Escape') {
            handleCancel();
          }
        }}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleSave}
        disabled={isSubmitting}
        title="Save"
      >
        <CheckIcon className="size-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleCancel}
        disabled={isSubmitting}
        title="Cancel"
      >
        <XIcon className="size-3" />
      </Button>
    </div>
  );
}

function Name({
  name,
  userId,
  participantId,
}: {
  name: string;
  userId: string | null;
  participantId: string;
}) {
  return (
    <div>
      <p className="font-medium">{name}</p>
      {participantId === userId && <p className="text-muted-foreground text-xs">You</p>}
    </div>
  );
}
