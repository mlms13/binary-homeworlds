/**
 * Action builder utilities for Binary Homeworlds
 */

import {
  SetupAction,
  MoveAction,
  CaptureAction,
  GrowAction,
  TradeAction,
  SacrificeAction,
  OverpopulationAction,
  Player,
  Color,
} from './types';

// Helper functions to create actions with proper timestamps

export function createSetupAction(
  player: Player,
  pieceId: string,
  role: 'star1' | 'star2' | 'ship'
): SetupAction {
  return {
    type: 'setup',
    player,
    timestamp: Date.now(),
    pieceId,
    role,
  };
}

export function createMoveAction(
  player: Player,
  shipId: string,
  fromSystemId: string,
  toSystemId?: string,
  newStarPieceId?: string
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

export function createCaptureAction(
  player: Player,
  attackingShipId: string,
  targetShipId: string,
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
  player: Player,
  actingShipId: string,
  systemId: string,
  newShipPieceId: string
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
  player: Player,
  shipId: string,
  systemId: string,
  newPieceId: string
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
  player: Player,
  sacrificedShipId: string,
  systemId: string,
  followupActions: (MoveAction | CaptureAction | GrowAction | TradeAction)[]
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
  player: Player,
  systemId: string,
  color: Color
): OverpopulationAction {
  return {
    type: 'overpopulation',
    player,
    timestamp: Date.now(),
    systemId,
    color,
  };
}
