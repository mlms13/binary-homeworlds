/**
 * Core types for Binary Homeworlds game
 */

// Basic game piece properties
export type Color = 'yellow' | 'green' | 'blue' | 'red';
export type Size = 1 | 2 | 3; // small, medium, large
export type Player = 'player1' | 'player2';

// Game piece representation
export interface Piece {
  color: Color;
  size: Size;
  id: string; // unique identifier for tracking
}

// Ship extends piece with ownership
export interface Ship extends Piece {
  owner: Player;
}

// Star is just a piece (no owner)
export interface Star extends Piece {}

// System represents a star system with stars and ships
export interface System {
  id: string;
  stars: Star[];
  ships: Ship[];
}

// Bank tracks available pieces
export interface Bank {
  pieces: Piece[];
}

// Player state
export interface PlayerState {
  homeSystemId: string;
}

// Game phase
export type GamePhase = 'setup' | 'normal' | 'ended';

// Game state
export interface GameState {
  phase: GamePhase;
  currentPlayer: Player;
  turnNumber: number;
  systems: System[];
  bank: Bank;
  players: {
    player1: PlayerState;
    player2: PlayerState;
  };
  winner?: Player;
  gameHistory: GameAction[];
}

// Action types
export type ActionType = 'setup' | 'move' | 'capture' | 'grow' | 'trade' | 'sacrifice' | 'overpopulation';

// Base action interface
export interface BaseAction {
  type: ActionType;
  player: Player;
  timestamp: number;
}

// Setup actions (initial phase)
export interface SetupAction extends BaseAction {
  type: 'setup';
  pieceId: string;
  role: 'star1' | 'star2' | 'ship';
}

// Basic actions
export interface MoveAction extends BaseAction {
  type: 'move';
  shipId: string;
  fromSystemId: string;
  toSystemId?: string; // undefined if creating new system
  newStarPieceId?: string; // required if creating new system
}

export interface CaptureAction extends BaseAction {
  type: 'capture';
  attackingShipId: string;
  targetShipId: string;
  systemId: string;
}

export interface GrowAction extends BaseAction {
  type: 'grow';
  actingShipId: string;
  systemId: string;
  newShipPieceId: string;
}

export interface TradeAction extends BaseAction {
  type: 'trade';
  shipId: string;
  systemId: string;
  newPieceId: string;
}

// Sacrifice action
export interface SacrificeAction extends BaseAction {
  type: 'sacrifice';
  sacrificedShipId: string;
  systemId: string;
  followupActions: (MoveAction | CaptureAction | GrowAction | TradeAction)[];
}

// Overpopulation action
export interface OverpopulationAction extends BaseAction {
  type: 'overpopulation';
  systemId: string;
  color: Color;
}

// Union type for all actions
export type GameAction = 
  | SetupAction 
  | MoveAction 
  | CaptureAction 
  | GrowAction 
  | TradeAction 
  | SacrificeAction 
  | OverpopulationAction;

// Action validation result
export interface ActionValidationResult {
  valid: boolean;
  error?: string;
}

// Game result
export interface GameResult {
  winner: Player;
  reason: 'no_ships_at_home' | 'home_stars_destroyed';
}
