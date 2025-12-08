import { Color, Piece, PieceId, Size } from './GamePiece';

type Sizes = Record<Size, Array<PieceId>>;

const emptySizes = {
  1: [],
  2: [],
  3: [],
};

const sizesToArray = (sizes: Sizes): Array<PieceId> => [
  ...sizes[1],
  ...sizes[2],
  ...sizes[3],
];

// Bank tracks available pieces
export type Bank = Record<Color, Sizes>;

/**
 * The initial state of a Bank with no pieces available.
 */
export const empty: Bank = {
  green: emptySizes,
  yellow: emptySizes,
  blue: emptySizes,
  red: emptySizes,
};

/**
 * The full state of a Bank with all pieces available.
 */
export const full: Bank = {
  green: {
    1: ['green-1-0', 'green-1-1', 'green-1-2'],
    2: ['green-2-0', 'green-2-1', 'green-2-2'],
    3: ['green-3-0', 'green-3-1', 'green-3-2'],
  },
  yellow: {
    1: ['yellow-1-0', 'yellow-1-1', 'yellow-1-2'],
    2: ['yellow-2-0', 'yellow-2-1', 'yellow-2-2'],
    3: ['yellow-3-0', 'yellow-3-1', 'yellow-3-2'],
  },
  blue: {
    1: ['blue-1-0', 'blue-1-1', 'blue-1-2'],
    2: ['blue-2-0', 'blue-2-1', 'blue-2-2'],
    3: ['blue-3-0', 'blue-3-1', 'blue-3-2'],
  },
  red: {
    1: ['red-1-0', 'red-1-1', 'red-1-2'],
    2: ['red-2-0', 'red-2-1', 'red-2-2'],
    3: ['red-3-0', 'red-3-1', 'red-3-2'],
  },
};

export const toArray = ({ green, yellow, blue, red }: Bank): Array<PieceId> => [
  ...sizesToArray(green),
  ...sizesToArray(yellow),
  ...sizesToArray(blue),
  ...sizesToArray(red),
];

export const size = (bank: Bank) => toArray(bank).length;

export const addPiece = ({ size, color, id }: Piece, bank: Bank): Bank => ({
  ...bank,
  [color]: {
    ...bank[color],
    [size]: [...bank[color][size], id],
  },
});

/**
 * Determines whether the bank contains a given piece.
 */
export const hasPiece = ({ size, color, id }: Piece, bank: Bank) =>
  bank[color][size].some(pieceId => pieceId === id);

/**
 * Determines whether the bank contains a piece for the given size and color.
 */
export const hasPieceBySizeAndColor = (
  size: Size,
  color: Color,
  bank: Bank
): boolean => bank[color][size].length > 0;

/**
 * Immutably removes a piece from the bank (by size and color) if that piece
 * exists in the bank. If a matching piece exists in the bank, that piece is
 * returned along with an updated bank (with the target piece omitted). If no
 * matching piece exists in the bank, the original bank is returned and the
 * returned piece will be undefined.
 */
export const takePieceBySizeAndColor = (
  size: Size,
  color: Color,
  bank: Bank
): [Piece | undefined, Bank] => {
  if (bank[color][size][0] === undefined) {
    return [undefined, bank];
  }

  const piece = { size, color, id: bank[color][size][0] };
  const newBank = {
    ...bank,
    [color]: { ...bank[color], [size]: bank[color][size].slice(1) },
  };

  return [piece, newBank];
};

/**
 * Finds the smallest piece by color in the bank.
 */
export const findSmallestSizeForColor = (
  color: Color,
  bank: Bank
): Size | undefined => {
  if (bank[color][1].length > 0) return 1;
  if (bank[color][2].length > 0) return 2;
  if (bank[color][3].length > 0) return 3;
  return undefined;
};

/**
 * Given a color, find the smallest piece matching that color and return it
 * along with an updated bank that no longer contains that piece.
 *
 * If no piece is found, the original bank is returned and the returned piece
 * will be undefined.
 */
export const takeSmallestPieceByColor = (
  color: Color,
  bank: Bank
): [Piece | undefined, Bank] => {
  const size = findSmallestSizeForColor(color, bank);
  if (size === undefined) {
    return [undefined, bank];
  }
  return takePieceBySizeAndColor(size, color, bank);
};
