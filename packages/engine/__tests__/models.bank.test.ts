import { describe, it, expect } from 'vitest';
import { Bank, GamePiece } from '../src/index';

// Use namespace for functions and values
const {
  addPiece,
  empty,
  findSmallestSizeForColor,
  full,
  hasPiece,
  hasPieceBySizeAndColor,
  size,
  takePieceBySizeAndColor,
  takeSmallestPieceByColor,
} = Bank;

// Use namespace for types
type Piece = GamePiece.Piece;

describe('Bank', () => {
  it('should create an empty bank', () => {
    expect(size(empty)).toBe(0);
  });

  it('should create a full bank', () => {
    expect(size(full)).toBe(36);
  });

  it('should add a piece to the bank', () => {
    const bank = addPiece({ color: 'green', size: 1, id: 'green-1-0' }, empty);
    expect(size(bank)).toBe(1);
  });

  it('should determine whether the bank contains a piece', () => {
    const bank = addPiece({ color: 'green', size: 1, id: 'green-1-0' }, empty);
    expect(hasPiece({ color: 'green', size: 1, id: 'green-1-0' }, bank)).toBe(
      true
    );
    expect(hasPiece({ color: 'green', size: 1, id: 'green-1-1' }, bank)).toBe(
      false
    );
  });

  it('should determine whether the bank contains a piece by size and color', () => {
    const bank = addPiece({ color: 'green', size: 1, id: 'green-1-0' }, empty);
    expect(hasPieceBySizeAndColor(1, 'green', bank)).toBe(true);
    expect(hasPieceBySizeAndColor(1, 'yellow', bank)).toBe(false);
  });

  it('should take a piece from the bank', () => {
    const [piece, bank] = takePieceBySizeAndColor(1, 'green', full);
    expect(piece).toBeDefined();
    expect(piece?.color).toBe('green');
    expect(piece?.size).toBe(1);
    expect(piece?.id).toBe('green-1-0');
    expect(size(bank)).toBe(35);
  });

  it('should not take a missing piece from the bank', () => {
    const [piece, bank] = takePieceBySizeAndColor(1, 'green', empty);
    expect(piece).toBeUndefined();
    expect(size(bank)).toBe(0);
  });

  it('should not allow taking the same piece twice from the bank', () => {
    const bank0 = addPiece({ color: 'green', size: 1, id: 'green-1-0' }, empty);
    expect(size(bank0)).toBe(1);

    const [piece, bank1] = takePieceBySizeAndColor(1, 'green', bank0);
    expect(piece).toBeDefined();
    expect(size(bank1)).toBe(0);

    const [piece2, bank2] = takePieceBySizeAndColor(1, 'green', bank1);
    expect(piece2).toBeUndefined();
    expect(size(bank2)).toBe(0);
  });

  it('should find and take the smallest piece by color', () => {
    const pieces: Array<Piece> = [
      { color: 'green', size: 1, id: 'green-1-0' },
      { color: 'green', size: 2, id: 'green-2-0' },
      { color: 'green', size: 3, id: 'green-3-0' },
    ];

    const bank = pieces.reduce((bank, piece) => addPiece(piece, bank), empty);
    expect(findSmallestSizeForColor('green', bank)).toBe(1);

    const [piece, bank2] = takeSmallestPieceByColor('green', bank);
    expect(piece).toBeDefined();
    expect(piece?.color).toBe('green');
    expect(piece?.size).toBe(1);
    expect(piece?.id).toBe('green-1-0');
    expect(size(bank2)).toBe(2);
    expect(findSmallestSizeForColor('green', bank2)).toBe(2);

    const [piece2, bank3] = takeSmallestPieceByColor('green', bank2);
    expect(piece2).toBeDefined();
    expect(piece2?.color).toBe('green');
    expect(piece2?.size).toBe(2);
    expect(piece2?.id).toBe('green-2-0');
    expect(size(bank3)).toBe(1);
    expect(findSmallestSizeForColor('green', bank3)).toBe(3);

    const [piece3, bank4] = takeSmallestPieceByColor('green', bank3);
    expect(piece3).toBeDefined();
    expect(piece3?.color).toBe('green');
    expect(piece3?.size).toBe(3);
    expect(piece3?.id).toBe('green-3-0');
    expect(size(bank4)).toBe(0);
    expect(findSmallestSizeForColor('green', bank4)).toBeUndefined();
  });

  it('should not find a smallest piece if the bank is empty', () => {
    const [piece, bank] = takeSmallestPieceByColor('green', empty);
    expect(piece).toBeUndefined();
    expect(size(bank)).toBe(0);
  });
});
