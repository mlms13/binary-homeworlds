import { describe, expect, it } from 'vitest';

import { Player } from '../src';

describe('Player', () => {
  it('should get the other player', () => {
    expect(Player.getOtherPlayer('player1')).toBe('player2');
    expect(Player.getOtherPlayer('player2')).toBe('player1');
  });
});
