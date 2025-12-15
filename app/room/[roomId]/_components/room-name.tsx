'use client';

import { Database } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';

type Props = {
  room: Database['public']['Tables']['rooms']['Row'] | null;
  isAdmin: boolean;
  variant?: 'small' | 'large';
};

export function RoomName({ room, variant = 'large' }: Props) {
  return (
    <div className="flex flex-1 items-center gap-2">
      <h1 className={cn('text-3xl font-bold tracking-tight', variant === 'small' && 'text-lg')}>
        {room?.room_name || 'Scrum Poker'}
      </h1>
    </div>
  );
}
