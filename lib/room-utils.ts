import { TSHIRT_NUMERIC_VALUES, TSHIRT_VALUES, VotingMode } from '@/types';

import { Database } from './supabase/database.types';

export function calculateAverage(
  votes: Database['public']['Tables']['votes']['Row'][],
  votingMode?: VotingMode | null,
): string | null {
  if (votingMode === 'tshirt') {
    return calculateTshirtMode(votes);
  }

  const numericVotes = votes
    .map((v) => v.vote_value)
    .filter((value) => value !== '?' && value !== '☕' && !Number.isNaN(Number(value)))
    .map(Number);

  if (numericVotes.length === 0) {
    return null;
  }

  const sum = numericVotes.reduce((acc, val) => acc + val, 0);
  const average = sum / numericVotes.length;
  return average.toFixed(1);
}

function calculateTshirtMode(votes: Database['public']['Tables']['votes']['Row'][]): string | null {
  const tshirtVotes = votes
    .map((v) => v.vote_value)
    .filter((value): value is string => value !== null && value !== '?' && value !== '☕')
    .filter((value) => value in TSHIRT_NUMERIC_VALUES);

  if (tshirtVotes.length === 0) {
    return null;
  }

  // Find the most common vote (mode)
  const voteCounts = tshirtVotes.reduce(
    (acc, vote) => {
      acc[vote] = (acc[vote] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const sortedByCount = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
  return sortedByCount[0][0];
}

export function allVotesMatch(
  votes: Database['public']['Tables']['votes']['Row'][],
  participants: Database['public']['Tables']['participants']['Row'][],
  votingMode?: VotingMode | null,
): boolean {
  if (participants.length === 0) {
    return false;
  }

  const validVotes =
    votingMode === 'tshirt'
      ? votes.filter((v) => v.vote_value != null && v.vote_value !== '?' && v.vote_value !== '☕')
      : votes.filter((v) => v.vote_value != null && !Number.isNaN(Number(v.vote_value)));

  if (validVotes.length === 0) {
    return false;
  }

  const allSameVotes = validVotes.every((v) => v.vote_value === validVotes[0].vote_value);

  return allSameVotes;
}

export function sortParticipantsByVote(
  participants: Database['public']['Tables']['participants']['Row'][],
  votes: Database['public']['Tables']['votes']['Row'][],
  votesRevealed: boolean,
  votingMode?: VotingMode | null,
): Database['public']['Tables']['participants']['Row'][] {
  if (!votesRevealed) {
    return participants;
  }

  return [...participants].sort((a, b) => {
    const voteA = votes.find((v) => v.participant_id === a.participant_id);
    const voteB = votes.find((v) => v.participant_id === b.participant_id);

    // If neither has voted, maintain original order
    if (!voteA?.vote_value && !voteB?.vote_value) {
      return 0;
    }

    // If only one has voted, voted comes first
    if (!voteA?.vote_value) {
      return 1;
    }
    if (!voteB?.vote_value) {
      return -1;
    }

    const valueA = voteA.vote_value;
    const valueB = voteB.vote_value;

    // T-shirt sizing mode
    if (votingMode === 'tshirt') {
      const tshirtOrder = TSHIRT_VALUES as readonly string[];
      const indexA = tshirtOrder.indexOf(valueA);
      const indexB = tshirtOrder.indexOf(valueB);

      // Known t-shirt sizes come before unknown
      if (indexA === -1 && indexB === -1) {
        return 0;
      }
      if (indexA === -1) {
        return 1;
      }
      if (indexB === -1) {
        return -1;
      }

      return indexA - indexB;
    }

    // Check if values are numeric
    const isNumericA = !Number.isNaN(Number(valueA));
    const isNumericB = !Number.isNaN(Number(valueB));

    // Numeric values come before non-numeric
    if (isNumericA && !isNumericB) {
      return -1;
    }
    if (!isNumericA && isNumericB) {
      return 1;
    }

    // Both numeric: sort by value
    if (isNumericA && isNumericB) {
      return Number(valueA) - Number(valueB);
    }

    // Both non-numeric: maintain order
    return 0;
  });
}

export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
