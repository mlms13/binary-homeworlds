/**
 * Core types for Binary Homeworlds game
 */

import { Bank, GamePiece, Player, StarSystem } from '@binary-homeworlds/engine';

// Player state
export interface PlayerState {
  homeSystemId: string;
}

// Game phase
export type GamePhase = 'setup' | 'normal';

// Game state
export interface GameState {
  tag: GamePhase;
  activePlayer: Player.Player;
  systems: Array<StarSystem.StarSystem>;
  bank: Bank.Bank;
  players: {
    player1: PlayerState;
    player2: PlayerState;
  };
  winner?: Player.Player;
  gameHistory: Array<GameAction>;
}

// Action types
export type ActionType =
  | 'setup'
  | 'move'
  | 'capture'
  | 'grow'
  | 'trade'
  | 'sacrifice'
  | 'overpopulation';

// Base action interface
export interface BaseAction {
  type: ActionType;
  player: Player.Player;
  timestamp: number;
}

// Setup actions (initial phase)
export interface SetupAction extends BaseAction {
  type: 'setup';
  pieceId: GamePiece.PieceId;
  role: 'star1' | 'star2' | 'ship';
}

// Basic actions
export interface MoveAction extends BaseAction {
  type: 'move';
  shipId: GamePiece.PieceId;
  fromSystemId: string;
  toSystemId?: string; // undefined if creating new system
  newStarPieceId?: GamePiece.PieceId; // required if creating new system
}

export interface CaptureAction extends BaseAction {
  type: 'capture';
  attackingShipId: GamePiece.PieceId;
  targetShipId: GamePiece.PieceId;
  systemId: string;
}

export interface GrowAction extends BaseAction {
  type: 'grow';
  actingShipId: GamePiece.PieceId;
  systemId: string;
  newShipPieceId: GamePiece.PieceId;
}

export interface TradeAction extends BaseAction {
  type: 'trade';
  shipId: GamePiece.PieceId;
  systemId: string;
  newPieceId: GamePiece.PieceId;
}

// Sacrifice action
export interface SacrificeAction extends BaseAction {
  type: 'sacrifice';
  sacrificedShipId: GamePiece.PieceId;
  systemId: string;
  followupActions: Array<MoveAction | CaptureAction | GrowAction | TradeAction>;
}

// Overpopulation action
export interface OverpopulationAction extends BaseAction {
  type: 'overpopulation';
  systemId: string;
  color: GamePiece.Color;
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
  winner: Player.Player;
  reason: 'no_ships_at_home' | 'home_stars_destroyed';
}

export interface HoverState {
  gameId: string;
  playerId: string; // Unique user/session identifier (UUID), not game role
  type: 'ship' | 'star' | 'system' | 'bankPiece';
  targetId: GamePiece.PieceId;
  timestamp: string;
}
