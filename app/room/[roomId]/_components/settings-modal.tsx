'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { resetVotesOfRoom, updateVotingMode } from '@/lib/queries/room-db';
import { roomQueryOptions, votesQueryOptions } from '@/lib/queries/room-queries';
import { updateRoomNameInHistory } from '@/lib/room-history';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';
import { TSHIRT_DEFAULT_DEFINITIONS, VotingMode } from '@/types';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { HashIcon, PencilIcon, SettingsIcon, ShirtIcon } from 'lucide-react';

import { useRoomContext } from './context';

type SettingsPage = 'general' | 'voting';

const SETTINGS_PAGES: { id: SettingsPage; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <PencilIcon className="size-4" /> },
  { id: 'voting', label: 'Voting', icon: <HashIcon className="size-4" /> },
];

type Props = {
  room: Database['public']['Tables']['rooms']['Row'];
};

export function SettingsModal({ room }: Props) {
  const [open, setOpen] = useState(false);
  const [activePage, setActivePage] = useState<SettingsPage>('general');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <SettingsIcon className="size-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton
        className="flex h-[460px] gap-0 overflow-hidden p-0 md:max-w-2xl"
      >
        <DialogTitle className="sr-only">Room Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Configure your room settings here.
        </DialogDescription>

        {/* Sidebar */}
        <nav className="bg-muted/30 flex w-48 shrink-0 flex-col border-r">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Settings</h2>
          </div>
          <div className="flex flex-col gap-1 p-2">
            {SETTINGS_PAGES.map((page) => (
              <button
                key={page.id}
                onClick={() => setActivePage(page.id)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                  activePage === page.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {page.icon}
                {page.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {activePage === 'general' && <GeneralSettings room={room} />}
          {activePage === 'voting' && <VotingSettings room={room} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GeneralSettings({ room }: { room: Database['public']['Tables']['rooms']['Row'] }) {
  const supabase = getSupabaseBrowserClient();
  const { roomId } = useParams<{ roomId: string }>();
  const queryClient = useQueryClient();
  const [roomName, setRoomName] = useState(room.room_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  async function handleSave() {
    if (!roomName.trim() || roomName === room.room_name) {
      return;
    }

    setIsSaving(true);

    const { data, error } = await supabase
      .from('rooms')
      .update({ room_name: roomName.trim() })
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      console.error('Error updating room name:', error);
    } else if (data) {
      updateRoomNameInHistory(roomId, roomName.trim());
      await queryClient.invalidateQueries(roomQueryOptions(supabase, roomId));
      setHasChanges(false);
    }

    setIsSaving(false);
  }

  function handleNameChange(value: string) {
    setRoomName(value);
    setHasChanges(value.trim() !== room.room_name);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b px-6 py-4">
        <h3 className="text-lg font-semibold">General</h3>
        <p className="text-muted-foreground text-sm">Manage general room settings</p>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="space-y-2">
          <label htmlFor="room-name" className="text-sm font-medium">
            Room Name
          </label>
          <Input
            id="room-name"
            value={roomName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Enter room name"
            maxLength={50}
          />
          <p className="text-muted-foreground text-xs">
            This name will be visible to all participants
          </p>
        </div>
      </div>
      <footer className="border-t px-6 py-4">
        <Button onClick={handleSave} disabled={!hasChanges || isSaving} size="sm">
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </footer>
    </div>
  );
}

function VotingSettings({ room }: { room: Database['public']['Tables']['rooms']['Row'] }) {
  const { roomId } = useParams<{ roomId: string }>();
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const { data: votes } = useSuspenseQuery(votesQueryOptions(supabase, roomId));
  const { setHasCelebrated } = useRoomContext();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<VotingMode | null>(null);
  const hasVotes = (votes.data?.length ?? 0) > 0;

  async function changeVotingMode(newMode: VotingMode) {
    if (hasVotes) {
      await resetVotesOfRoom(supabase, roomId);
      setHasCelebrated(false);
    }

    await updateVotingMode(supabase, roomId, newMode);
    await queryClient.invalidateQueries(roomQueryOptions(supabase, roomId));
    await queryClient.invalidateQueries(votesQueryOptions(supabase, roomId));
    setShowConfirm(false);
    setPendingMode(null);
  }

  function handleModeSelect(newMode: VotingMode) {
    if (newMode === room.voting_mode) {
      return;
    }
    if (hasVotes) {
      setPendingMode(newMode);
      setShowConfirm(true);
    } else {
      changeVotingMode(newMode);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Voting</h3>
        <p className="text-muted-foreground text-sm">Configure voting options for this room</p>
      </header>
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">Voting Mode</label>
          <div className="grid gap-3">
            <VotingModeCard
              selected={room.voting_mode === 'fibonacci'}
              onClick={() => handleModeSelect('fibonacci')}
              icon={<HashIcon className="size-5" />}
              title="Fibonacci"
              description="0, 1, 2, 3, 5, 8, 13, 21"
            />
            <VotingModeCard
              selected={room.voting_mode === 'tshirt'}
              onClick={() => handleModeSelect('tshirt')}
              icon={<ShirtIcon className="size-5" />}
              title="T-Shirt Sizing"
              description="XS, S, M, L, XL, XXL"
            />
          </div>
        </div>

        {room.voting_mode === 'tshirt' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">T-Shirt Size Guide</label>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {Object.entries(TSHIRT_DEFAULT_DEFINITIONS).map(([size, definition]) => (
                  <div key={size} className="flex justify-between">
                    <span className="font-semibold">{size}</span>
                    <span className="text-muted-foreground">{definition}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation dialog for changing mode with existing votes */}
        {showConfirm && (
          <div className="bg-destructive/10 border-destructive/30 space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">
              Switching to {pendingMode === 'tshirt' ? 'T-Shirt sizing' : 'Fibonacci'} will reset
              all current votes.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => pendingMode && changeVotingMode(pendingMode)}
              >
                Switch Mode
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowConfirm(false);
                  setPendingMode(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VotingModeCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg border p-4 text-left transition-all',
        selected
          ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
          : 'hover:bg-muted/50 border-border cursor-pointer',
      )}
    >
      <div
        className={cn(
          'flex size-10 items-center justify-center rounded-lg',
          selected ? 'bg-primary text-primary-foreground' : 'bg-muted',
        )}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-muted-foreground text-sm">{description}</div>
      </div>
      {selected && (
        <div className="bg-primary size-5 rounded-full p-0.5 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
}
