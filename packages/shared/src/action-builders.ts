/**
 * Action builder utilities for Binary Homeworlds
 */

import { GamePiece, Player } from '@binary-homeworlds/engine';

import {
  CaptureAction,
  GrowAction,
  MoveAction,
  OverpopulationAction,
  SacrificeAction,
  SetupAction,
  TradeAction,
} from './types';

// Helper functions to create actions with proper timestamps

export function createSetupAction(
  player: Player.Player,
  color: GamePiece.Color,
  size: GamePiece.Size,
  role: 'star1' | 'star2' | 'ship'
): SetupAction {
  return {
    type: 'setup',
    player,
    timestamp: Date.now(),
    color,
    size,
    role,
  };
}

export function createMoveAction(
  player: Player.Player,
  shipId: GamePiece.PieceId,
  fromSystemId: string,
  toSystemId?: string,
  newStarPieceId?: GamePiece.PieceId
): MoveAction {
  return {
    type: 'move',
    player,
    timestamp: Date.now(),
    shipId,
    fromSystemId,
    toSystemId,
    newStarPieceId,
  };
}

export function createMoveActionExisting(
  player: Player.Player,
  shipId: GamePiece.PieceId,
  fromSystemId: string,
  toSystemId: string
): MoveAction {
  return {
    type: 'move',
    player,
    timestamp: Date.now(),
    shipId,
    fromSystemId,
    toSystemId,
  };
}

export function createMoveActionNew(
  player: Player.Player,
  shipId: GamePiece.PieceId,
  fromSystemId: string,
  newStarPieceId: GamePiece.PieceId
): MoveAction {
  return {
    type: 'move',
    player,
    timestamp: Date.now(),
    shipId,
    fromSystemId,
    newStarPieceId,
  };
}

export function createCaptureAction(
  player: Player.Player,
  attackingShipId: GamePiece.PieceId,
  targetShipId: GamePiece.PieceId,
  systemId: string
): CaptureAction {
  return {
    type: 'capture',
    player,
    timestamp: Date.now(),
    attackingShipId,
    targetShipId,
    systemId,
  };
}

export function createGrowAction(
  player: Player.Player,
  actingShipId: GamePiece.PieceId,
  systemId: string,
  newShipPieceId: GamePiece.PieceId
): GrowAction {
  return {
    type: 'grow',
    player,
    timestamp: Date.now(),
    actingShipId,
    systemId,
    newShipPieceId,
  };
}

export function createTradeAction(
  player: Player.Player,
  shipId: GamePiece.PieceId,
  systemId: string,
  newPieceId: GamePiece.PieceId
): TradeAction {
  return {
    type: 'trade',
    player,
    timestamp: Date.now(),
    shipId,
    systemId,
    newPieceId,
  };
}

export function createSacrificeAction(
  player: Player.Player,
  sacrificedShipId: GamePiece.PieceId,
  systemId: string,
  followupActions: Array<MoveAction | CaptureAction | GrowAction | TradeAction>
): SacrificeAction {
  return {
    type: 'sacrifice',
    player,
    timestamp: Date.now(),
    sacrificedShipId,
    systemId,
    followupActions,
  };
}

export function createOverpopulationAction(
  player: Player.Player,
  systemId: string,
  color: GamePiece.Color
): OverpopulationAction {
  return {
    type: 'overpopulation',
    player,
    timestamp: Date.now(),
    systemId,
    color,
  };
}
