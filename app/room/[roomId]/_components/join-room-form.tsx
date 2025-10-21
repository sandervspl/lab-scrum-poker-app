'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  participantsQueryOptions,
  roomQueryOptions,
  votesQueryOptions,
} from '@/lib/queries/room-queries';
import { addRoomToHistory } from '@/lib/room-history';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const joinRoomSchema = z.object({
  name: z.string().min(1, 'Name is required').max(20, 'Name must be 20 characters or less').trim(),
});

type JoinRoomFormValues = z.infer<typeof joinRoomSchema>;

type Props = {
  roomId: string;
  room: Database['public']['Tables']['rooms']['Row'] | null;
  isAdmin: boolean;
  currentParticipantId: string | null;
};

export function JoinRoomForm({ roomId, room, isAdmin, currentParticipantId }: Props) {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  const form = useForm<JoinRoomFormValues>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      name: '',
    },
  });

  async function onSubmit(values: JoinRoomFormValues) {
    const participantId = currentParticipantId || crypto.randomUUID();

    // Check if participant already exists in this room
    const { data: existingParticipant } = await supabase
      .from('participants')
      .select('id')
      .eq('room_id', roomId)
      .eq('participant_id', participantId)
      .single();

    if (existingParticipant && !currentParticipantId) {
      form.setError('name', { message: 'You are already in this room' });
      return;
    }

    const { error } = await supabase.from('participants').upsert(
      {
        room_id: roomId,
        name: values.name,
        participant_id: participantId,
      },
      {
        onConflict: 'room_id,participant_id',
      },
    );

    if (error) {
      console.error('[v0] Error joining room:', error);
      if (error.message.includes('participants_name_length_check')) {
        form.setError('name', { message: 'Name must be 20 characters or less' });
      } else {
        form.setError('name', { message: 'Failed to join room' });
      }
      return;
    }

    addRoomToHistory(roomId, isAdmin, participantId, values.name, room?.room_name || undefined);

    // Refetch all room queries
    queryClient.invalidateQueries(roomQueryOptions(supabase, roomId));
    queryClient.invalidateQueries(participantsQueryOptions(supabase, roomId));
    queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
  }

  return (
    <div className="from-background via-background to-muted/20 flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Room {room?.room_name ? `"${room.room_name}"` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" autoFocus {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                Join Room
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
