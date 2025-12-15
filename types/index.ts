export const POKER_VALUES = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];

export const TSHIRT_VALUES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕'] as const;

export const TSHIRT_DEFAULT_DEFINITIONS: Record<string, string> = {
  XS: '1-2 days',
  S: '3-5 days',
  M: '1-2 weeks',
  L: '2-4 weeks',
  XL: '1-2 months',
  XXL: '> 2 months',
};

// Numeric values for t-shirt sizes (used for sorting and average calculations)
export const TSHIRT_NUMERIC_VALUES: Record<string, number> = {
  XS: 1.5,
  S: 4,
  M: 7.5,
  L: 21,
  XL: 45,
  XXL: 90,
};

export type VotingMode = 'fibonacci' | 'tshirt';

export type TshirtDefinitions = Record<string, string>;

export function getVotingValues(mode: VotingMode | null): readonly string[] {
  return mode === 'tshirt' ? TSHIRT_VALUES : POKER_VALUES;
}

export function getTshirtDefinitions(
  customDefinitions: TshirtDefinitions | null | undefined,
): TshirtDefinitions {
  if (!customDefinitions || Object.keys(customDefinitions).length === 0) {
    return TSHIRT_DEFAULT_DEFINITIONS;
  }
  return { ...TSHIRT_DEFAULT_DEFINITIONS, ...customDefinitions };
}
