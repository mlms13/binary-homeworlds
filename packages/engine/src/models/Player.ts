export type Player = 'player1' | 'player2';

export const getOtherPlayer = (player: Player): Player => {
  return player === 'player1' ? 'player2' : 'player1';
};
