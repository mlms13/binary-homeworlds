/**
 * Core types for Binary Homeworlds game
 */

import {
  GameAction as EngineGameAction,
  GamePiece,
  Player,
} from '@binary-homeworlds/engine';

// Game phase
export type GamePhase = 'setup' | 'normal';

// Action types
type SetupActionType = 'setup:take_star' | 'setup:take_ship';
type NormalActionType = 'move' | 'capture' | 'grow' | 'trade' | 'sacrifice';
type SpecialActionType = 'overpopulation';
export type ActionType = SetupActionType | NormalActionType | SpecialActionType;

// Base action interface
export interface BaseAction {
  type: ActionType;
  player: Player.Player;
  timestamp: number;
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
export type SacrificeAction = BaseAction & {
  type: 'sacrifice';
  sacrificedShipId: GamePiece.PieceId;
  systemId: string;
  followupActions: Array<MoveAction | CaptureAction | GrowAction | TradeAction>;
};

// Overpopulation action
export interface OverpopulationAction extends BaseAction {
  type: 'overpopulation';
  systemId: string;
  color: GamePiece.Color;
}

// Union type for all actions
export type GameSetupAction = EngineGameAction.Action;
export type GameNormalAction =
  | MoveAction
  | CaptureAction
  | GrowAction
  | TradeAction
  | SacrificeAction;
export type GameSpecialAction = OverpopulationAction;

export type GameAction = GameSetupAction | GameNormalAction | GameSpecialAction;

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
