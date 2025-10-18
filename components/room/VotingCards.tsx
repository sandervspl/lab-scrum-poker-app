'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';
import { POKER_VALUES, type Vote } from '@/types';

interface VotingCardsProps {
  currentVote: Database['public']['Tables']['votes']['Row'] | undefined;
  onCastVote: (value: string) => void;
}

export function VotingCards({ currentVote, onCastVote }: VotingCardsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Select Your Vote</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
          {POKER_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onCastVote(value)}
              className={cn(
                'flex aspect-[3/4] cursor-pointer items-center justify-center rounded-lg border-2 text-2xl font-bold transition-all hover:scale-105 hover:shadow-lg',
                currentVote?.vote_value === value
                  ? 'border-primary bg-primary text-primary-foreground scale-105 shadow-lg'
                  : 'border-border bg-card hover:border-primary/50',
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
