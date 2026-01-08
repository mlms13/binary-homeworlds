/**
 * Utility functions for Binary Homeworlds game
 */

import {
  Bank,
  Game,
  GameAction,
  GamePiece,
  Player,
  StarSystem,
} from '@binary-homeworlds/engine';

import {
  CaptureAction,
  GameAction as SharedGameAction,
  GameNormalAction,
  GrowAction,
  MoveAction,
  OverpopulationAction,
  SacrificeAction,
  TradeAction,
} from './types';

// ============================================================================
// Bank adapter functions - bridge between Engine Bank and Shared Piece[]
// ============================================================================

/**
 * Convert Engine Bank to an array of Pieces
 */
export function bankToPieces(bank: Bank.Bank): Array<GamePiece.Piece> {
  const pieces: Array<GamePiece.Piece> = [];
  const colors: Array<GamePiece.Color> = ['yellow', 'green', 'blue', 'red'];
  const sizes: Array<GamePiece.Size> = [1, 2, 3];

  for (const color of colors) {
    for (const size of sizes) {
      for (const id of bank[color][size]) {
        pieces.push({ color, size, id });
      }
    }
  }

  return pieces;
}

/**
 * Find a piece by ID in Engine Bank
 */
export function findPieceInBank(
  bank: Bank.Bank,
  pieceId: GamePiece.PieceId
): GamePiece.Piece | undefined {
  const colors: Array<GamePiece.Color> = ['yellow', 'green', 'blue', 'red'];
  const sizes: Array<GamePiece.Size> = [1, 2, 3];

  for (const color of colors) {
    for (const size of sizes) {
      // Engine's Bank stores PieceId[], but we use arbitrary string IDs
      // This is safe at runtime since Engine's Bank just stores strings
      const pieceIds = bank[color][size] as unknown as Array<string>;
      const index = pieceIds.indexOf(pieceId);
      if (index !== -1) {
        return { color, size, id: pieceId };
      }
    }
  }

  return undefined;
}

/**
 * Remove a piece from Engine Bank by ID
 */
export function removePieceFromBankById(
  bank: Bank.Bank,
  pieceId: GamePiece.PieceId
): [GamePiece.Piece | null, Bank.Bank] {
  const piece = findPieceInBank(bank, pieceId);
  if (!piece) {
    return [null, bank];
  }

  // Create a new bank with the piece removed
  const pieceIds = bank[piece.color][piece.size].filter(id => id !== pieceId);
  const newBank = {
    ...bank,
    [piece.color]: {
      ...bank[piece.color],
      [piece.size]: pieceIds,
    },
  };

  return [piece, newBank];
}

/**
 * Add a piece to Engine Bank
 */
export function addPieceToEngineBank(
  piece: GamePiece.Piece,
  bank: Bank.Bank
): Bank.Bank {
  // Engine's Bank expects PieceId type, but we use arbitrary string IDs
  // This is safe at runtime since Engine's Bank just stores strings
  return Bank.addPiece(
    {
      color: piece.color,
      size: piece.size,
      id: piece.id,
    },
    bank
  );
}

/**
 * Add multiple pieces to Engine Bank
 */
export function addPiecesToEngineBank(
  pieces: Array<GamePiece.Piece>,
  bank: Bank.Bank
): Bank.Bank {
  let result = bank;
  for (const piece of pieces) {
    result = addPieceToEngineBank(piece, result);
  }
  return result;
}

// ============================================================================
// Legacy bank utility functions (now using Engine Bank)
// ============================================================================

/**
 * Get the smallest available size of a color from the bank
 */
export function getSmallestAvailableSize(
  bank: Bank.Bank,
  color: GamePiece.Color
): GamePiece.Size | null {
  const pieces = bankToPieces(bank);
  const availableSizes = pieces
    .filter(piece => piece.color === color)
    .map(piece => piece.size)
    .sort((a, b) => a - b);

  return availableSizes.length > 0 ? (availableSizes[0] ?? null) : null;
}

// Find a system by ID
export function findSystem(
  gameState: Game.GameState,
  systemId: string
): StarSystem.StarSystem | undefined {
  return Game.getAllSystems(gameState).find(system => system.id === systemId);
}

// Find a ship by ID across all systems (homeworlds and normal star systems)
export function findShip(
  gameState: Game.GameState,
  shipId: GamePiece.PieceId
): { ship: GamePiece.Ship; system: StarSystem.StarSystem } | undefined {
  for (const system of Game.getAllSystems(gameState)) {
    const ship = system.ships.find(ship => ship.id === shipId);
    if (ship) return { ship, system };
  }

  return undefined;
}

// Check if a player has any ships at their home system
export function hasShipsAtHome(
  gameState: Game.GameState,
  player: Player.Player
): boolean {
  const homeSystem = gameState.homeSystems[player];
  return homeSystem.ships.some(ship => ship.owner === player);
}

// Check if a player's home system has any stars
export function hasStarsAtHome(
  gameState: Game.GameState,
  player: Player.Player
): boolean {
  const homeSystem = gameState.homeSystems[player];
  return homeSystem.stars.length > 0;
}

// Check if the game has ended and return the winner
export function findGameWinner(
  gameState: Game.GameState
): Player.Player | undefined {
  for (const player of ['player1', 'player2'] as const) {
    const hasShips = hasShipsAtHome(gameState, player);
    const hasStars = hasStarsAtHome(gameState, player);

    // Player loses if they have no ships at home OR no stars at home
    if (!hasShips || !hasStars) {
      return Player.getOtherPlayer(player);
    }
  }

  return undefined;
}

// ============================================================================
// Legacy action application functions
// ============================================================================

function applyMoveAction(
  gameState: Game.GameState<'normal'>,
  action: MoveAction
): Game.GameState<'normal'> {
  let ship: GamePiece.Ship | undefined = undefined;
  let fromSystem: StarSystem.StarSystem | undefined = undefined;
  const allSystems = Game.getAllSystems(gameState);

  for (const system of allSystems) {
    const foundShip = system.ships.find(s => s.id === action.shipId);
    if (foundShip) {
      ship = foundShip;
      fromSystem = system;
      break;
    }
  }

  if (!ship) throw new Error('Ship not found');
  if (!fromSystem) throw new Error('System not found');

  // Remove ship from origin system
  const [removed, updatedFrom] = StarSystem.removeShip(ship, fromSystem);
  if (!removed) throw new Error('Failed to remove ship from origin system');

  // Update the game state with the new "from" system, cleaning it up if it's
  // no longer valid
  const nextState = Game.setSystemWithCleanup(updatedFrom, gameState);

  // If a "to" system is provided, find it and add the ship to it
  if (action.toSystemId) {
    const toSystem = findSystem(nextState, action.toSystemId);
    if (!toSystem) throw new Error('Destination system not found');
    const updatedTo = StarSystem.addShip(ship, toSystem);
    return Game.setSystemWithCleanup(updatedTo, nextState);
  }

  // Otherwise, create the new system (removing the star piece from the bank)
  // and add the ship to it
  if (!action.newStarPieceId) throw new Error('New star piece ID required');
  const [newStarPiece, bank] = removePieceFromBankById(
    nextState.bank,
    action.newStarPieceId
  );
  if (!newStarPiece) throw new Error('New star piece not found in bank');

  const newSystem = StarSystem.createNormal(newStarPiece, [ship]);
  return {
    ...Game.addSystem(newSystem, nextState),
    bank,
  };
}

function applyGrowAction(
  gameState: Game.GameState<'normal'>,
  action: GrowAction
): Game.GameState<'normal'> {
  const system = findSystem(gameState, action.systemId);
  if (!system) throw new Error('System not found');

  const [newShipPiece, bank] = removePieceFromBankById(
    gameState.bank,
    action.newShipPieceId
  );
  if (!newShipPiece) throw new Error('New ship piece not found in bank');

  const newShip = { ...newShipPiece, owner: action.player };
  const updatedSystem = StarSystem.addShip(newShip, system);

  return {
    ...Game.setSystemWithCleanup(updatedSystem, gameState),
    bank,
  };
}

function applyCaptureAction(
  gameState: Game.GameState<'normal'>,
  action: CaptureAction
): Game.GameState<'normal'> {
  const system = findSystem(gameState, action.systemId);
  if (!system) throw new Error('System not found');

  // Find target ship and change ownership
  const targetShip = system.ships.find(s => s.id === action.targetShipId);
  if (!targetShip) throw new Error('Target ship not found');

  const updatedSystem = StarSystem.changeShipOwner(targetShip, system);
  return {
    ...Game.setSystemWithCleanup(updatedSystem, gameState),
    activePlayer: Player.getOtherPlayer(action.player),
  };
}

function applyTradeAction(
  gameState: Game.GameState<'normal'>,
  action: TradeAction
): Game.GameState<'normal'> {
  const system = findSystem(gameState, action.systemId);
  if (!system) throw new Error('System not found');

  // Find ship to trade
  const ship = system.ships.find(s => s.id === action.shipId);
  if (!ship) throw new Error('Ship not found');

  // remove the old ship from the system and return it to the ban
  const [removedPiece, updatedSystem] = StarSystem.removeShip(ship, system);
  if (!removedPiece) throw new Error('Ship not at target system');
  const bank = addPieceToEngineBank(removedPiece, gameState.bank);

  // take the new piece out of the (updated) bank
  const [newShipPiece, updatedBank] = removePieceFromBankById(
    bank,
    action.newPieceId
  );

  if (!newShipPiece) throw new Error('New piece not found in bank');

  // add the new ship to the system
  const newShip = { ...newShipPiece, owner: action.player };
  const nextSystem = StarSystem.addShip(newShip, updatedSystem);
  return {
    ...Game.setSystemWithCleanup(nextSystem, gameState),
    bank: updatedBank,
  };
}

function applySacrificeAction(
  gameState: Game.GameState<'normal'>,
  action: SacrificeAction
): Game.GameState<'normal'> {
  const system = findSystem(gameState, action.systemId);
  if (!system) throw new Error('System not found');

  // find the sacrificed ship and return it to the bank
  const sacrificedShip = system.ships.find(
    s => s.id === action.sacrificedShipId
  );
  if (!sacrificedShip) throw new Error('Sacrificed ship not found');

  const [removedPiece, updatedSystem] = StarSystem.removeShip(
    sacrificedShip,
    system
  );
  if (!removedPiece) throw new Error('Failed to remove sacrificed ship');

  // update the game state and clean up the system
  const cleanedState = Game.setSystemWithCleanup(updatedSystem, gameState);

  // return the sacrificed ship to the (updated) bank
  const updatedBank = addPieceToEngineBank(
    GamePiece.shipToPiece(sacrificedShip),
    cleanedState.bank
  );

  // update the game state with the new system
  const nextState = { ...cleanedState, bank: updatedBank };

  // Check for game end immediately after sacrifice (before followup actions)
  // This is crucial: if sacrificing leaves the player with no ships at home, they lose
  // immediately (before getting a chance to e.g. move a ship back home)
  const isHomeSystem =
    nextState.homeSystems[action.player].id === updatedSystem.id;
  if (isHomeSystem) {
    const winningPlayer = findGameWinner(nextState);
    if (winningPlayer) {
      return { ...nextState, winner: winningPlayer };
    }
  }

  // apply the followup actions
  return action.followupActions.reduce(applyNormalAction, nextState);
}

function applyOverpopulationAction(
  gameState: Game.GameState<'normal'>,
  action: OverpopulationAction
): Game.GameState<'normal'> {
  const system = findSystem(gameState, action.systemId);
  if (!system) throw new Error('System not found');

  // remove all pieces of the overpopulating color from the system
  const [removedPieces, updatedSystem] = StarSystem.removePiecesOfColor(
    system,
    action.color
  );

  // update the game state with the (potentially cleaned up) system
  const cleanedUp = Game.setSystemWithCleanup(updatedSystem, gameState);

  // then, update the new state with the pieces we need to return to the bank
  const nextState = {
    ...cleanedUp,
    bank: addPiecesToEngineBank(removedPieces, cleanedUp.bank),
  };

  // determine if the game has ended
  const winningPlayer = findGameWinner(nextState);
  if (winningPlayer) {
    return { ...nextState, winner: winningPlayer };
  }

  // return the next state
  return nextState;
}

function applySetupAction(
  gameState: Game.GameState<'setup'>,
  action: GameAction.Action
): Game.GameState {
  return GameAction.apply(gameState, action);
}

function applyNormalAction(
  gameState: Game.GameState<'normal'>,
  action: GameNormalAction
): Game.GameState<'normal'> {
  switch (action.type) {
    case 'move':
      return applyMoveAction(gameState, action);
    case 'capture':
      return applyCaptureAction(gameState, action);
    case 'grow':
      return applyGrowAction(gameState, action);
    case 'trade':
      return applyTradeAction(gameState, action);
    case 'sacrifice':
      return applySacrificeAction(gameState, action);
  }
}

/**
 * Given the newer (engine) GameState definition, and an action type that
 * combines engine actions with shared actions, apply the action to the state.
 */
export function applyAction(
  gameState: Game.GameState,
  action: SharedGameAction
): Game.GameState {
  if (action.type === 'setup:take_ship' || action.type === 'setup:take_star') {
    if (gameState.tag !== 'setup')
      throw new Error('Invalid state for setup action');
    return applySetupAction(gameState, action);
  }

  if (gameState.tag !== 'normal')
    throw new Error('Invalid state for normal or overpopulation action');

  if (action.type === 'overpopulation') {
    return applyOverpopulationAction(gameState, action);
  }

  // FIXME: It's weird that some actions check for game-end conditions and others
  // do not. It's also confusing that some actions update the active player. Really,
  // those actions should not (as a sacrifice could cause us to repeat the same
  // action multiple times).
  return {
    ...applyNormalAction(gameState, action),
    activePlayer: Player.getOtherPlayer(action.player),
  };
}
