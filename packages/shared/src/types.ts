/**
 * Core types for Binary Homeworlds game
 */

import { Bank, GamePiece, Player } from '@binary-homeworlds/engine';

// System represents a star system with stars and ships
export interface System {
  id: string;
  stars: GamePiece.Star[];
  ships: GamePiece.Ship[];
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
  currentPlayer: Player.Player;
  turnNumber: number;
  systems: System[];
  bank: Bank.Bank;
  players: {
    player1: PlayerState;
    player2: PlayerState;
  };
  winner?: Player.Player;
  gameHistory: GameAction[];
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
  followupActions: (MoveAction | CaptureAction | GrowAction | TradeAction)[];
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
  playerId: Player.Player;
  type: 'ship' | 'star' | 'system' | 'bankPiece';
  targetId: GamePiece.PieceId;
  timestamp: string;
}
