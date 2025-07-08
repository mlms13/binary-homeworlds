/**
 * Action validation for Binary Homeworlds game
 */

import {
  GameAction,
  GameState,
  ActionValidationResult,
  SetupAction,
  MoveAction,
  CaptureAction,
  GrowAction,
  TradeAction,
  SacrificeAction,
  OverpopulationAction,
  Color,
} from './types';
import {
  findSystem,
  findShip,
  isColorAvailable,
  hasOverpopulation,
  getSmallestAvailableSize,
} from './utils';

export class ActionValidator {
  static validate(
    action: GameAction,
    gameState: GameState
  ): ActionValidationResult {
    // Check if game has ended first
    if (gameState.phase === 'ended') {
      return { valid: false, error: 'Game has ended' };
    }

    // Check if it's the correct player's turn
    if (action.player !== gameState.currentPlayer) {
      return { valid: false, error: 'Not your turn' };
    }

    switch (action.type) {
      case 'setup':
        return this.validateSetupAction(action, gameState);
      case 'move':
        return this.validateMoveAction(action, gameState);
      case 'capture':
        return this.validateCaptureAction(action, gameState);
      case 'grow':
        return this.validateGrowAction(action, gameState);
      case 'trade':
        return this.validateTradeAction(action, gameState);
      case 'sacrifice':
        return this.validateSacrificeAction(action, gameState);
      case 'overpopulation':
        return this.validateOverpopulationAction(action, gameState);
      default:
        return { valid: false, error: 'Unknown action type' };
    }
  }

  private static validateSetupAction(
    action: SetupAction,
    gameState: GameState
  ): ActionValidationResult {
    if (gameState.phase !== 'setup') {
      return {
        valid: false,
        error: 'Setup actions only allowed during setup phase',
      };
    }

    // Check if piece exists in bank
    const piece = gameState.bank.pieces.find(p => p.id === action.pieceId);
    if (!piece) {
      return { valid: false, error: 'Piece not found in bank' };
    }

    // Additional setup validation would depend on the specific setup step
    // For now, we'll assume it's valid if the piece exists
    return { valid: true };
  }

  private static validateMoveAction(
    action: MoveAction,
    gameState: GameState
  ): ActionValidationResult {
    if (gameState.phase !== 'normal') {
      return {
        valid: false,
        error: 'Move actions only allowed during normal play',
      };
    }

    // Find the ship and its current system
    const shipResult = findShip(gameState, action.shipId);
    if (!shipResult) {
      return { valid: false, error: 'Ship not found' };
    }

    const { ship, system: fromSystem } = shipResult;

    // Check if player owns the ship
    if (ship.owner !== action.player) {
      return { valid: false, error: 'You do not own this ship' };
    }

    // Check if yellow (move) is available at the origin system
    if (!isColorAvailable(fromSystem, 'yellow', action.player)) {
      return {
        valid: false,
        error: 'Yellow (move) action not available at this system',
      };
    }

    // Validate destination
    if (action.toSystemId) {
      // Moving to existing system
      const toSystem = findSystem(gameState, action.toSystemId);
      if (!toSystem) {
        return { valid: false, error: 'Destination system not found' };
      }

      // Check size restriction: ALL destination star sizes must be different from ALL origin star sizes
      const originSizes = fromSystem.stars.map(star => star.size);
      const destinationSizes = toSystem.stars.map(star => star.size);

      const hasValidDestination = destinationSizes.every(
        destSize => !originSizes.includes(destSize)
      );

      if (!hasValidDestination) {
        return {
          valid: false,
          error:
            'Destination system must have stars of different sizes than origin system',
        };
      }
    } else {
      // Creating new system
      if (!action.newStarPieceId) {
        return {
          valid: false,
          error: 'New star piece ID required when creating new system',
        };
      }

      const newStarPiece = gameState.bank.pieces.find(
        p => p.id === action.newStarPieceId
      );
      if (!newStarPiece) {
        return { valid: false, error: 'New star piece not found in bank' };
      }

      // Check size restriction for new star
      const originSizes = fromSystem.stars.map(star => star.size);
      if (originSizes.includes(newStarPiece.size)) {
        return {
          valid: false,
          error: 'New star must be different size than origin system stars',
        };
      }
    }

    return { valid: true };
  }

  private static validateCaptureAction(
    action: CaptureAction,
    gameState: GameState
  ): ActionValidationResult {
    if (gameState.phase !== 'normal') {
      return {
        valid: false,
        error: 'Capture actions only allowed during normal play',
      };
    }

    const system = findSystem(gameState, action.systemId);
    if (!system) {
      return { valid: false, error: 'System not found' };
    }

    // Find attacking ship
    const attackingShip = system.ships.find(
      s => s.id === action.attackingShipId
    );
    if (!attackingShip) {
      return { valid: false, error: 'Attacking ship not found in system' };
    }

    if (attackingShip.owner !== action.player) {
      return { valid: false, error: 'You do not own the attacking ship' };
    }

    // Find target ship
    const targetShip = system.ships.find(s => s.id === action.targetShipId);
    if (!targetShip) {
      return { valid: false, error: 'Target ship not found in system' };
    }

    if (targetShip.owner === action.player) {
      return { valid: false, error: 'Cannot capture your own ship' };
    }

    // Check size restriction
    if (attackingShip.size < targetShip.size) {
      return {
        valid: false,
        error: 'Attacking ship must be equal or larger size than target',
      };
    }

    // Check if red (capture) is available
    if (!isColorAvailable(system, 'red', action.player)) {
      return {
        valid: false,
        error: 'Red (capture) action not available at this system',
      };
    }

    return { valid: true };
  }

  private static validateGrowAction(
    action: GrowAction,
    gameState: GameState
  ): ActionValidationResult {
    if (gameState.phase !== 'normal') {
      return {
        valid: false,
        error: 'Grow actions only allowed during normal play',
      };
    }

    const system = findSystem(gameState, action.systemId);
    if (!system) {
      return { valid: false, error: 'System not found' };
    }

    // Find acting ship
    const actingShip = system.ships.find(s => s.id === action.actingShipId);
    if (!actingShip) {
      return { valid: false, error: 'Acting ship not found in system' };
    }

    if (actingShip.owner !== action.player) {
      return { valid: false, error: 'You do not own the acting ship' };
    }

    // Check if green (grow) is available
    if (!isColorAvailable(system, 'green', action.player)) {
      return {
        valid: false,
        error: 'Green (grow) action not available at this system',
      };
    }

    // Check if new ship piece exists in bank
    const newShipPiece = gameState.bank.pieces.find(
      p => p.id === action.newShipPieceId
    );
    if (!newShipPiece) {
      return { valid: false, error: 'New ship piece not found in bank' };
    }

    // Check if new ship has same color as acting ship
    if (newShipPiece.color !== actingShip.color) {
      return {
        valid: false,
        error: 'New ship must have same color as acting ship',
      };
    }

    // Check if new ship is smallest available size of that color
    const smallestSize = getSmallestAvailableSize(
      gameState.bank.pieces,
      actingShip.color
    );
    if (smallestSize === null || newShipPiece.size !== smallestSize) {
      return {
        valid: false,
        error: 'New ship must be smallest available size of that color',
      };
    }

    return { valid: true };
  }

  private static validateTradeAction(
    action: TradeAction,
    gameState: GameState
  ): ActionValidationResult {
    if (gameState.phase !== 'normal') {
      return {
        valid: false,
        error: 'Trade actions only allowed during normal play',
      };
    }

    const system = findSystem(gameState, action.systemId);
    if (!system) {
      return { valid: false, error: 'System not found' };
    }

    // Find ship to trade
    const ship = system.ships.find(s => s.id === action.shipId);
    if (!ship) {
      return { valid: false, error: 'Ship not found in system' };
    }

    if (ship.owner !== action.player) {
      return { valid: false, error: 'You do not own this ship' };
    }

    // Check if blue (trade) is available
    if (!isColorAvailable(system, 'blue', action.player)) {
      return {
        valid: false,
        error: 'Blue (trade) action not available at this system',
      };
    }

    // Check if new piece exists in bank
    const newPiece = gameState.bank.pieces.find(
      p => p.id === action.newPieceId
    );
    if (!newPiece) {
      return { valid: false, error: 'New piece not found in bank' };
    }

    // Check if new piece has same size as ship being traded
    if (newPiece.size !== ship.size) {
      return {
        valid: false,
        error: 'New piece must have same size as ship being traded',
      };
    }

    // Check if new piece has different color
    if (newPiece.color === ship.color) {
      return {
        valid: false,
        error: 'New piece must have different color than ship being traded',
      };
    }

    return { valid: true };
  }

  private static validateSacrificeAction(
    action: SacrificeAction,
    gameState: GameState
  ): ActionValidationResult {
    if (gameState.phase !== 'normal') {
      return {
        valid: false,
        error: 'Sacrifice actions only allowed during normal play',
      };
    }

    const system = findSystem(gameState, action.systemId);
    if (!system) {
      return { valid: false, error: 'System not found' };
    }

    // Find sacrificed ship
    const sacrificedShip = system.ships.find(
      s => s.id === action.sacrificedShipId
    );
    if (!sacrificedShip) {
      return { valid: false, error: 'Sacrificed ship not found in system' };
    }

    if (sacrificedShip.owner !== action.player) {
      return { valid: false, error: 'You do not own the sacrificed ship' };
    }

    // Check if sacrificing this ship would end the game (no ships at home)
    const isHomeSystem =
      gameState.players[action.player].homeSystemId === action.systemId;
    const playerShipsAtHome = isHomeSystem
      ? system.ships.filter(s => s.owner === action.player)
      : [];
    const wouldEndGame =
      isHomeSystem &&
      playerShipsAtHome.length === 1 &&
      playerShipsAtHome[0].id === action.sacrificedShipId;

    // Check number of followup actions matches ship size
    // Exception: if this sacrifice would end the game, no followup actions are needed
    if (
      !wouldEndGame &&
      action.followupActions.length !== sacrificedShip.size
    ) {
      return {
        valid: false,
        error: `Number of followup actions (${action.followupActions.length}) must equal ship size (${sacrificedShip.size})`,
      };
    }

    // If this sacrifice would end the game, no followup actions should be provided
    if (wouldEndGame && action.followupActions.length > 0) {
      return {
        valid: false,
        error:
          'Sacrificing your last ship at home ends the game immediately - no followup actions allowed',
      };
    }

    // Check that all followup actions have the same color as sacrificed ship
    for (const followupAction of action.followupActions) {
      const expectedColor = sacrificedShip.color;
      let actionColor: Color;

      switch (followupAction.type) {
        case 'move':
          actionColor = 'yellow';
          break;
        case 'capture':
          actionColor = 'red';
          break;
        case 'grow':
          actionColor = 'green';
          break;
        case 'trade':
          actionColor = 'blue';
          break;
        default:
          return { valid: false, error: 'Invalid followup action type' };
      }

      if (actionColor !== expectedColor) {
        return {
          valid: false,
          error: `All followup actions must be ${expectedColor} actions`,
        };
      }
    }

    // For sacrifice actions, we don't need to validate the followup actions here
    // because they will be validated when they are applied, and sacrifice
    // specifically allows actions that wouldn't normally be available
    // We just need to validate the basic structure and ownership

    return { valid: true };
  }

  private static validateOverpopulationAction(
    action: OverpopulationAction,
    gameState: GameState
  ): ActionValidationResult {
    const system = findSystem(gameState, action.systemId);
    if (!system) {
      return { valid: false, error: 'System not found' };
    }

    // Check if the specified color actually has overpopulation
    if (!hasOverpopulation(system, action.color)) {
      return {
        valid: false,
        error: `No overpopulation of ${action.color} in this system`,
      };
    }

    return { valid: true };
  }
}
