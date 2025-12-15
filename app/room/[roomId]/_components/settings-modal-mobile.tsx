'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
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

type SettingsPage = 'general' | 'voting' | 'tshirt-definitions';

type Props = {
  room: Database['public']['Tables']['rooms']['Row'];
};

export function SettingsModalMobile({ room }: Props) {
  const [open, setOpen] = useState(false);
  const [activePage, setActivePage] = useState<SettingsPage>('general');

  function handleBack() {
    if (activePage === 'tshirt-definitions') {
      setActivePage('voting');
    }
  }

  const showBackButton = activePage === 'tshirt-definitions';
  const pageTitle =
    activePage === 'general'
      ? 'General'
      : activePage === 'voting'
        ? 'Voting'
        : 'T-Shirt Definitions';

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <SettingsIcon className="size-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerTitle className="sr-only">Room Settings</DrawerTitle>
        <DrawerDescription className="sr-only">
          Configure your room settings here.
        </DrawerDescription>

        {/* Header with title and tabs */}
        <div className="border-b px-4 pb-3">
          <div className="flex items-center gap-2">
            {showBackButton && (
              <Button variant="ghost" size="icon" className="size-8" onClick={handleBack}>
                <ChevronLeftIcon className="size-4" />
              </Button>
            )}
            <h2 className="text-base font-semibold">{pageTitle}</h2>
          </div>

          {/* Tab navigation - hide when in nested page */}
          {activePage !== 'tshirt-definitions' && (
            <div className="mt-3 flex gap-1">
              <TabButton
                active={activePage === 'general'}
                onClick={() => setActivePage('general')}
                icon={<PencilIcon className="size-3.5" />}
                label="General"
              />
              <TabButton
                active={activePage === 'voting'}
                onClick={() => setActivePage('voting')}
                icon={<HashIcon className="size-3.5" />}
                label="Voting"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activePage === 'general' && <MobileGeneralSettings room={room} />}
          {activePage === 'voting' && (
            <MobileVotingSettings room={room} onNavigate={setActivePage} />
          )}
          {activePage === 'tshirt-definitions' && <MobileTshirtDefinitionsSettings room={room} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileGeneralSettings({ room }: { room: Database['public']['Tables']['rooms']['Row'] }) {
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
    <div className="flex flex-col">
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <label htmlFor="room-name-mobile" className="text-sm font-medium">
            Room Name
          </label>
          <Input
            id="room-name-mobile"
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
      <div className="border-t p-4">
        <Button onClick={handleSave} disabled={!hasChanges || isSaving} size="sm" className="w-full">
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

function MobileVotingSettings({
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
    <div className="flex flex-col">
      <div className="space-y-4 p-4">
        <div className="space-y-3">
          <label className="text-sm font-medium">Voting Mode</label>
          <div className="grid gap-2">
            <MobileVotingModeCard
              selected={room.voting_mode === 'fibonacci'}
              onClick={() => handleModeSelect('fibonacci')}
              icon={<HashIcon className="size-4" />}
              title="Fibonacci"
              description="0, 1, 2, 3, 5, 8, 13, 21"
            />
            <MobileVotingModeCard
              selected={room.voting_mode === 'tshirt'}
              onClick={() => handleModeSelect('tshirt')}
              icon={<ShirtIcon className="size-4" />}
              title="T-Shirt Sizing"
              description="XS, S, M, L, XL, XXL"
            />
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => onNavigate('tshirt-definitions')}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <ShirtIcon className="size-4" />
            T-Shirt Definitions
          </span>
          <ChevronRightIcon className="text-muted-foreground size-4" />
        </Button>

        {showConfirm && (
          <div className="bg-destructive/10 border-destructive/30 space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">
              Switching to {pendingMode === 'tshirt' ? 'T-Shirt sizing' : 'Fibonacci'} will reset
              all current votes.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => pendingMode && changeVotingMode(pendingMode)}
              >
                Switch
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
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

function MobileTshirtDefinitionsSettings({
  room,
}: {
  room: Database['public']['Tables']['rooms']['Row'];
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
    <div className="flex flex-col">
      <div className="space-y-3 p-4">
        <p className="text-muted-foreground text-xs">
          Customize what each size means for this room
        </p>
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
      </div>
      <div className="flex items-center justify-between gap-2 border-t p-4">
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving} size="sm">
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

function MobileVotingModeCard({
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
        'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
        selected
          ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
          : 'hover:bg-accent border-border',
      )}
    >
      <div
        className={cn(
          'flex size-9 items-center justify-center rounded-lg',
          selected ? 'bg-primary text-primary-foreground' : 'bg-muted',
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-muted-foreground truncate text-xs">{description}</div>
      </div>
      {selected && (
        <div className="bg-primary size-4 shrink-0 rounded-full p-0.5 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
}

