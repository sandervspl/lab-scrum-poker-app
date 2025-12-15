'use client';

import { useOptimistic, useState, useTransition } from 'react';
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
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { resetVotesOfRoom, updateVotingMode } from '@/lib/queries/room-db';
import { roomQueryOptions, votesQueryOptions } from '@/lib/queries/room-queries';
import { updateRoomNameInHistory } from '@/lib/room-history';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';
import {
  getTshirtDefinitions,
  TSHIRT_DEFAULT_DEFINITIONS,
  TSHIRT_VALUES,
  TshirtDefinitions,
  VotingMode,
} from '@/types';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HashIcon,
  PencilIcon,
  SettingsIcon,
  ShirtIcon,
} from 'lucide-react';

import { useRoomContext } from './context';
import { SettingsModalMobile } from './settings-modal-mobile';

type SettingsPage = 'general' | 'voting' | 'tshirt-definitions';

const SETTINGS_PAGES: { id: SettingsPage; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <PencilIcon className="size-4" /> },
  { id: 'voting', label: 'Voting', icon: <HashIcon className="size-4" /> },
];

type Props = {
  room: Database['public']['Tables']['rooms']['Row'];
};

export function SettingsModal({ room }: Props) {
  const isMobile = useIsMobile();

  // Show nothing during SSR/hydration to prevent layout shift
  if (isMobile === undefined) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5" disabled>
        <SettingsIcon className="size-4" />
        <span className="hidden sm:inline">Settings</span>
      </Button>
    );
  }

  if (isMobile) {
    return <SettingsModalMobile room={room} />;
  }

  return <SettingsModalDesktop room={room} />;
}

function SettingsModalDesktop({ room }: Props) {
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
        className="flex h-[500px] gap-0 overflow-hidden p-0 md:max-w-2xl"
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
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {activePage === 'general' && <GeneralSettings room={room} />}
          {activePage === 'voting' && <VotingSettings room={room} onNavigate={setActivePage} />}
          {activePage === 'tshirt-definitions' && (
            <TshirtDefinitionsSettings room={room} onBack={() => setActivePage('voting')} />
          )}
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
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b px-6 py-4">
        <h3 className="text-lg font-semibold">General</h3>
        <p className="text-muted-foreground text-sm">Manage general room settings</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
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
      <footer className="shrink-0 border-t px-6 py-4">
        <Button onClick={handleSave} disabled={!hasChanges || isSaving} size="sm">
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </footer>
    </div>
  );
}

function VotingSettings({
  room,
  onNavigate,
}: {
  room: Database['public']['Tables']['rooms']['Row'];
  onNavigate: (page: SettingsPage) => void;
}) {
  const { roomId } = useParams<{ roomId: string }>();
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const { data: votes } = useSuspenseQuery(votesQueryOptions(supabase, roomId));
  const { setHasCelebrated } = useRoomContext();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<VotingMode | null>(null);
  const hasVotes = (votes.data?.length ?? 0) > 0;
  const [, startTransition] = useTransition();
  const [optimisticVotingMode, setOptimisticVotingMode] = useOptimistic(
    room.voting_mode,
    (_current, newMode: VotingMode) => newMode,
  );

  async function changeVotingMode(newMode: VotingMode) {
    setOptimisticVotingMode(newMode);
    setShowConfirm(false);
    setPendingMode(null);

    startTransition(async () => {
      if (hasVotes) {
        await resetVotesOfRoom(supabase, roomId);
        setHasCelebrated(false);
      }

      await updateVotingMode(supabase, roomId, newMode);
      await Promise.all([
        queryClient.invalidateQueries(roomQueryOptions(supabase, roomId)),
        await queryClient.invalidateQueries(votesQueryOptions(supabase, roomId)),
      ]);
    });
  }

  function handleModeSelect(newMode: VotingMode) {
    if (newMode === optimisticVotingMode) {
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
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Voting</h3>
        <p className="text-muted-foreground text-sm">Configure voting options for this room</p>
      </header>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">Voting Mode</label>
          <div className="grid gap-3">
            <VotingModeCard
              selected={optimisticVotingMode === 'fibonacci'}
              onClick={() => handleModeSelect('fibonacci')}
              icon={<HashIcon className="size-5" />}
              title="Fibonacci"
              description="0, 1, 2, 3, 5, 8, 13, 21"
            />
            <VotingModeCard
              selected={optimisticVotingMode === 'tshirt'}
              onClick={() => handleModeSelect('tshirt')}
              icon={<ShirtIcon className="size-5" />}
              title="T-Shirt Sizing"
              description="XS, S, M, L, XL, XXL"
            />
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => onNavigate('tshirt-definitions')}
          className="w-full justify-start gap-2"
        >
          <ShirtIcon className="size-4" />
          T-Shirt Sizing Definitions
          <ChevronRightIcon className="text-sidebar-foreground ml-auto size-4" />
        </Button>

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

function TshirtDefinitionsSettings({
  room,
  onBack,
}: {
  room: Database['public']['Tables']['rooms']['Row'];
  onBack: () => void;
}) {
  const { roomId } = useParams<{ roomId: string }>();
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  const currentDefinitions = getTshirtDefinitions(room.tshirt_definitions as TshirtDefinitions);
  const [definitions, setDefinitions] = useState<TshirtDefinitions>(currentDefinitions);
  const [isSaving, setIsSaving] = useState(false);
  const definitionSizes = TSHIRT_VALUES.filter((v) => v !== '?' && v !== '☕');

  const hasChanges = JSON.stringify(definitions) !== JSON.stringify(currentDefinitions);

  async function handleSave() {
    setIsSaving(true);

    const { error } = await supabase
      .from('rooms')
      .update({ tshirt_definitions: definitions })
      .eq('id', roomId);

    if (error) {
      console.error('Error saving definitions:', error);
    } else {
      await queryClient.invalidateQueries(roomQueryOptions(supabase, roomId));
    }

    setIsSaving(false);
  }

  function handleReset() {
    setDefinitions(TSHIRT_DEFAULT_DEFINITIONS);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b px-6 py-4">
        <Button onClick={onBack} variant="outline" size="icon" className="mb-2 size-8">
          <ChevronLeftIcon className="size-4" />
        </Button>
        <h3 className="text-lg font-semibold">T-Shirt Sizing Definitions</h3>
        <p className="text-muted-foreground text-sm">
          Customize what each size means for this room
        </p>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        {definitionSizes.map((size) => (
          <div key={size} className="flex items-center gap-3">
            <span className="w-10 text-sm font-semibold">{size}</span>
            <Input
              value={definitions[size] ?? ''}
              onChange={(e) => setDefinitions((prev) => ({ ...prev, [size]: e.target.value }))}
              placeholder={TSHIRT_DEFAULT_DEFINITIONS[size]}
              className="h-9"
            />
          </div>
        ))}
        <p className="text-muted-foreground text-xs">
          These definitions are shown on voting cards when using T-Shirt sizing
        </p>
      </div>
      <footer className="flex shrink-0 items-center justify-between border-t px-6 py-4">
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Reset to defaults
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving} size="sm">
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </footer>
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
          : 'hover:bg-accent border-border cursor-pointer',
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
