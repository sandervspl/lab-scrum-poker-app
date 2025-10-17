'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addRoomToHistory, updateRoomNameInHistory } from '@/lib/room-history';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { POKER_VALUES, type Participant, type Room, type Vote } from '@/types';
import confetti from 'canvas-confetti';
import { Check, Copy, Eye, EyeOff, Pencil, Trash2, Users } from 'lucide-react';

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [editedRoomName, setEditedRoomName] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  function allVotesMatch() {
    if (participants.length === 0) {
      return false;
    }

    const validVotes = votes
      // Filter out non-votes and non-numbers
      .filter((v) => v.vote_value != null && !Number.isNaN(Number(v.vote_value)));

    if (validVotes.length === 0) {
      return false;
    }

    const allSameVotes = validVotes.every((v) => v.vote_value === votes[0].vote_value);

    return allSameVotes;
  }

  function randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  function launchConfetti() {
    confetti({
      angle: randomInRange(55, 125),
      spread: randomInRange(50, 70),
      particleCount: randomInRange(50, 100),
      origin: { y: 0.6 },
    });
  }

  async function shootConfetti() {
    launchConfetti();
    await new Promise((resolve) => setTimeout(resolve, 300));
    launchConfetti();
    await new Promise((resolve) => setTimeout(resolve, 300));
    launchConfetti();
  }

  useEffect(() => {
    const adminId = searchParams.get('admin');
    if (adminId) {
      setIsAdmin(true);
      setCurrentParticipantId(adminId);
      localStorage.setItem(`participant_${roomId}`, adminId);
      localStorage.setItem(`admin_${roomId}`, 'true');
    } else {
      const storedId = localStorage.getItem(`participant_${roomId}`);
      if (storedId) {
        setCurrentParticipantId(storedId);
      }
    }
  }, [roomId, searchParams]);

  const fetchRoom = useCallback(async () => {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();

    if (error) {
      console.error('[v0] Error fetching room:', error);
      return;
    }

    setRoom(data);
  }, [roomId, supabase]);

  const fetchParticipants = useCallback(async () => {
    console.log('[v0] Fetching participants');
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('[v0] Error fetching participants:', error);
      return;
    }

    console.log('[v0] Participants fetched:', data);
    setParticipants(data);
  }, [roomId, supabase]);

  const fetchVotes = useCallback(async () => {
    console.log('[v0] Fetching votes');
    const { data, error } = await supabase.from('votes').select('*').eq('room_id', roomId);

    if (error) {
      console.error('[v0] Error fetching votes:', error);
      return;
    }

    console.log('[v0] Votes fetched:', data);
    setVotes(data);
  }, [roomId, supabase]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload: any) => {
          console.log('[v0] Room updated:', payload);
          if (payload.new) {
            setRoom(payload.new as Room);
            fetchVotes();
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('[v0] Participants changed:', payload);
          fetchParticipants();
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('[v0] Vote inserted:', payload);
          fetchVotes();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('[v0] Vote updated:', payload);
          fetchVotes();
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          console.log('[v0] Vote deleted:', payload);
          fetchVotes();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase, fetchParticipants, fetchVotes]);

  useEffect(() => {
    if (currentParticipantId) {
      const checkParticipant = async () => {
        const { data } = await supabase
          .from('participants')
          .select('*')
          .eq('room_id', roomId)
          .eq('participant_id', currentParticipantId)
          .single();

        if (data) {
          setHasJoined(true);
          setName(data.name);
          await fetchParticipants();
          await fetchVotes();
        } else {
          setHasJoined(false);
        }

        if (room && room.admin_id === currentParticipantId) {
          setIsAdmin(true);
          localStorage.setItem(`admin_${roomId}`, 'true');
        }
      };

      checkParticipant();
    }
  }, [currentParticipantId, roomId, supabase, room, fetchParticipants, fetchVotes]);

  const joinRoom = async () => {
    if (!name.trim()) return;

    const participantId = currentParticipantId || crypto.randomUUID();

    const { error } = await supabase.from('participants').upsert(
      {
        room_id: roomId,
        name: name.trim(),
        participant_id: participantId,
      },
      {
        onConflict: 'room_id,participant_id',
      },
    );

    if (error) {
      console.error('[v0] Error joining room:', error);
      alert('Failed to join room');
      return;
    }

    setCurrentParticipantId(participantId);
    localStorage.setItem(`participant_${roomId}`, participantId);
    setHasJoined(true);

    addRoomToHistory(roomId, isAdmin, name.trim(), room?.room_name || undefined);

    await fetchParticipants();
    await fetchVotes();
  };

  const castVote = async (value: string) => {
    if (!currentParticipantId) {
      console.log('[v0] Cannot cast vote: no participant ID');
      return;
    }

    console.log('[v0] Casting vote:', { roomId, participantId: currentParticipantId, value });

    const existingVoteIndex = votes.findIndex((v) => v.participant_id === currentParticipantId);

    const previousVotes = [...votes];

    if (existingVoteIndex >= 0) {
      const updatedVotes = [...votes];
      updatedVotes[existingVoteIndex] = {
        ...updatedVotes[existingVoteIndex],
        vote_value: value,
      };
      setVotes(updatedVotes);
    } else {
      const newVote: Vote = {
        id: crypto.randomUUID(),
        room_id: roomId,
        participant_id: currentParticipantId,
        vote_value: value,
        voted_at: new Date().toISOString(),
      };
      setVotes([...votes, newVote]);
    }

    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('room_id', roomId)
      .eq('participant_id', currentParticipantId)
      .single();

    if (existingVote) {
      console.log('[v0] Updating existing vote');
      const { error } = await supabase
        .from('votes')
        .update({ vote_value: value })
        .eq('room_id', roomId)
        .eq('participant_id', currentParticipantId);

      if (error) {
        console.error('[v0] Error updating vote:', error);
        setVotes(previousVotes);
      } else {
        console.log('[v0] Vote updated successfully');
        await fetchVotes();
      }
    } else {
      console.log('[v0] Inserting new vote');
      const { error } = await supabase.from('votes').insert({
        room_id: roomId,
        participant_id: currentParticipantId,
        vote_value: value,
      });

      if (error) {
        console.error('[v0] Error inserting vote:', error);
        setVotes(previousVotes);
      } else {
        console.log('[v0] Vote inserted successfully');
        await fetchVotes();
      }
    }
  };

  const toggleVotesVisibility = async () => {
    const newValue = !room?.votes_revealed;

    const { error } = await supabase
      .from('rooms')
      .update({ votes_revealed: newValue })
      .eq('id', roomId);

    if (error) {
      console.error('[v0] Error toggling votes visibility:', error);
      return;
    }

    await fetchRoom();
    if (newValue && !hasCelebrated && allVotesMatch()) {
      shootConfetti();
      setHasCelebrated(true);
    }
  };

  const resetVotes = async () => {
    console.log('[v0] Resetting votes');
    const { error: votesError } = await supabase.from('votes').delete().eq('room_id', roomId);

    if (votesError) {
      console.error('[v0] Error deleting votes:', votesError);
      return;
    }

    console.log('[v0] Votes deleted successfully');

    await supabase.from('rooms').update({ votes_revealed: false }).eq('id', roomId);

    await fetchVotes();
    await fetchRoom();
    setShowResetDialog(false);
    setHasCelebrated(false);
  };

  const copyRoomLink = () => {
    const url = window.location.origin + `/room/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateRoomName = async () => {
    if (!editedRoomName.trim() || editedRoomName === room?.room_name) {
      setIsEditingRoomName(false);
      return;
    }

    const { error } = await supabase
      .from('rooms')
      .update({ room_name: editedRoomName.trim() })
      .eq('id', roomId);

    if (error) {
      console.error('[v0] Error updating room name:', error);
      alert('Failed to update room name');
    } else {
      updateRoomNameInHistory(roomId, editedRoomName.trim());
      await fetchRoom();
    }

    setIsEditingRoomName(false);
  };

  const startEditingRoomName = () => {
    setEditedRoomName(room?.room_name || `Room ${roomId.slice(0, 8)}`);
    setIsEditingRoomName(true);
  };

  const removeParticipant = async (participantId: string) => {
    if (!isAdmin) return;

    // Prevent admin from removing themselves
    if (participantId === currentParticipantId) {
      alert('You cannot remove yourself from the room');
      return;
    }

    const confirmRemove = confirm('Are you sure you want to remove this participant?');
    if (!confirmRemove) return;

    console.log('[v0] Removing participant:', participantId);

    // Delete participant's votes first
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .eq('room_id', roomId)
      .eq('participant_id', participantId);

    if (votesError) {
      console.error('[v0] Error deleting participant votes:', votesError);
    }

    // Delete participant
    const { error: participantError } = await supabase
      .from('participants')
      .delete()
      .eq('room_id', roomId)
      .eq('participant_id', participantId);

    if (participantError) {
      console.error('[v0] Error removing participant:', participantError);
      alert('Failed to remove participant');
      return;
    }

    console.log('[v0] Participant removed successfully');
    await fetchParticipants();
    await fetchVotes();
  };

  const currentVote = votes.find((v) => v.participant_id === currentParticipantId);

  const calculateAverage = () => {
    const numericVotes = votes
      .map((v) => v.vote_value)
      .filter((value) => value !== '?' && value !== '☕' && !Number.isNaN(Number(value)))
      .map(Number);

    if (numericVotes.length === 0) return null;

    const sum = numericVotes.reduce((acc, val) => acc + val, 0);
    const average = sum / numericVotes.length;
    return average.toFixed(1);
  };

  const averageVote = calculateAverage();

  const sortedParticipants = room?.votes_revealed
    ? [...participants].sort((a, b) => {
        const voteA = votes.find((v) => v.participant_id === a.participant_id);
        const voteB = votes.find((v) => v.participant_id === b.participant_id);

        // If neither has voted, maintain original order
        if (!voteA?.vote_value && !voteB?.vote_value) return 0;

        // If only one has voted, voted comes first
        if (!voteA?.vote_value) return 1;
        if (!voteB?.vote_value) return -1;

        const valueA = voteA.vote_value;
        const valueB = voteB.vote_value;

        // Check if values are numeric
        const isNumericA = !Number.isNaN(Number(valueA));
        const isNumericB = !Number.isNaN(Number(valueB));

        // Numeric values come before non-numeric
        if (isNumericA && !isNumericB) return -1;
        if (!isNumericA && isNumericB) return 1;

        // Both numeric: sort by value
        if (isNumericA && isNumericB) {
          return Number(valueA) - Number(valueB);
        }

        // Both non-numeric: maintain order
        return 0;
      })
    : participants;

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading room...</p>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="from-background via-background to-muted/20 flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Join Room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              />
            </div>
            <Button onClick={joinRoom} disabled={!name.trim()} className="w-full">
              Join Room
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="from-background via-background to-muted/20 min-h-[calc(100vh-3.5rem)] bg-gradient-to-br p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Scrum Poker</h1>
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
              ) : (
                <p className="text-muted-foreground">
                  {room?.room_name || `Room: ${roomId.slice(0, 8)}`}
                </p>
              )}
              {isAdmin && !isEditingRoomName && (
                <Button
                  onClick={startEditingRoomName}
                  type="button"
                  className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  aria-label="Edit room name"
                  variant="ghost"
                >
                  <Pencil className="h-3.5 w-3.5" />
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

        {/* Voting Cards */}
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
                  onClick={() => castVote(value)}
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

        {/* Participants and Votes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Participants ({participants.length})
            </CardTitle>
            <div className="flex items-center gap-3">
              {room.votes_revealed && averageVote && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Average:</span>
                  <Badge variant="default" className="px-3 py-1 text-lg font-bold">
                    {averageVote}
                  </Badge>
                </div>
              )}
              <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Reset Votes
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset all votes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear all votes and hide them. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={resetVotes}>Reset</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button onClick={toggleVotesVisibility} variant="outline" size="sm">
                {room.votes_revealed ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide Votes
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Show Votes
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedParticipants.map((participant) => {
                const vote = votes.find((v) => v.participant_id === participant.participant_id);
                const hasVoted = vote?.vote_value !== null && vote?.vote_value !== undefined;

                return (
                  <div
                    key={participant.id}
                    className="bg-muted flex items-center gap-4 rounded-lg p-3"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full font-semibold',
                          hasVoted
                            ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-primary/10 text-primary',
                        )}
                      >
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{participant.name}</p>
                        {participant.participant_id === currentParticipantId && (
                          <p className="text-muted-foreground text-xs">You</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {room.votes_revealed && hasVoted ? (
                        <Badge variant="secondary" className="px-3 py-1 text-base font-semibold">
                          {vote.vote_value}
                        </Badge>
                      ) : hasVoted ? (
                        <Badge variant="secondary">Voted</Badge>
                      ) : (
                        <Badge variant="outline">Waiting</Badge>
                      )}
                      {isAdmin && participant.participant_id !== currentParticipantId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                          onClick={() => removeParticipant(participant.participant_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
