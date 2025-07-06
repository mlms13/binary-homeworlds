## Description

Binary Homeworlds is a two-player strategy game where each player controls a home star system with two stars (a binary system). The objective is to eliminate your opponent by either capturing all their ships at their home system or destroying both stars in their home system.

## Setup

The game uses 36 pyramid-shaped pieces stored in a shared bank:

- **4 colors**: yellow, green, blue, red
- **3 sizes**: large (size 3), medium (size 2), small (size 1)
- **3 pieces** of each color-size combination

## Gameplay

### Initial Phase (Setup)

1. **Determine turn order** (by any agreed method)
2. **Players alternate choosing pieces** to create their home systems:
   - **Player 1** chooses any piece from the bank as their first star
   - **Player 2** chooses any piece from the bank as their first star
   - **Player 1** chooses any remaining piece from the bank as their second star
   - **Player 2** chooses any remaining piece from the bank as their second star
   - **Player 1** chooses any remaining piece from the bank as their starting ship
   - **Player 2** chooses any remaining piece from the bank as their starting ship

Each player's two stars form their binary home system. Each starting ship is placed at its respective player's home system.

**Setup Summary**: The setup phase consists of 6 alternating choices, with each player making 3 selections total (2 stars + 1 ship).

### Normal Turns

On each turn, the active player must choose exactly one of the following:

#### Basic Action

Choose one ship you control to perform a basic action. You can only perform an action if its color is **available** at that ship's location.

**A color is available at a system if:**

- The system contains a star of that color, OR
- You control a ship of that color at that system

**Basic Actions:**

- **Move (yellow)**: Move one of your ships to a different star system

  - The destination star must be a different size than any star at the origin system
  - You may move to an existing system or create a new system
  - If creating a new system, choose any piece from the bank as the new star
  - If the moving ship was the only ship at its origin system, return all stars from that system to the bank

- **Capture (red)**: Take control of an opponent's ship at the same system

  - The target ship must be equal or smaller size than your acting ship
  - The captured ship immediately becomes yours

- **Grow (green)**: Create a new ship at the same system

  - The new ship has the same color as the ship performing the action
  - The new ship has the smallest available size of that color from the bank
  - If no pieces of the required color are available in the bank, you cannot grow

- **Trade (blue)**: Exchange one of your ships for a different colored piece from the bank
  - Both pieces must be the same size
  - If the bank lacks the desired color in the required size, you cannot trade

#### Sacrifice Action

Sacrifice one of your ships to gain multiple actions this turn.

- **Number of actions**: Equal to the size of the sacrificed ship (small = 1, medium = 2, large = 3)
- **Action color**: All actions match the color of the sacrificed ship
- **Availability**: These actions can be performed by any of your ships, regardless of normal color availability rules
- **Timing**: Remove the sacrificed ship immediately, then perform the actions
- **System cleanup**: If the sacrificed ship was the only ship at its system, return all stars from that system to the bank

### Overpopulation

Either player may declare "overpopulation" at any time when a star system contains 4 or more pieces of the same color (counting both ships and stars, regardless of ownership).

This is not a turn action and can be declared by either player at any time when the condition is met.

**When overpopulation is declared:**

1. Return all pieces of the overpopulating color to the bank (both ships and stars)
2. If no stars remain at the system, return all remaining ships to the bank as well

### Ending the Game

A player loses (and their opponent wins) when either:

- They control no ships at their home star system, OR
- Both stars in their home star system are destroyed

The game ends immediately when either condition is met.

## Examples and Rules Clarifications

### Color Availability Examples

**Example 1: Basic availability**

- System: Small yellow star
- Player A: Large green ship
- Player B: Medium red ship

Available actions:

- Player A can **move** (yellow star) or **grow** (green ship)
- Player B can **move** (yellow star) or **capture** (red ship)
- Neither player can **trade** (no blue available)

**Example 2: Sacrifice for unavailable actions**

- Player A's home: Large blue star + small yellow star, with large green ship
- Player B: Medium yellow ship at Player A's home
- Player A elsewhere: Small red ship

Player A cannot normally capture at home (no red available), but can sacrifice their small red ship elsewhere to gain 1 red action, then use it to capture Player B's ship at home.

### Movement Examples

**Example 3: Valid movement destinations**

- Origin system: Medium blue star + large yellow star
- Ship: Small green ship

Valid destinations:

- Any system with only small stars
- A new sytem with a small star (choose from bank)

Invalid destinations:

- Systems containing medium stars
- Systems containing large stars

**Example 4: System cleanup after movement**

- System: Large red star with only one ship (medium yellow)
- Action: Move the yellow ship away

Result: The red star returns to the bank (no ships remain)

### Capture Examples

**Example 5: Size restrictions**

- System: Small red star
- Player A: Large yellow ship
- Player B: Medium blue ship, small green ship

Player A can capture either of Player B's ships (both are smaller than large). Player B cannot capture Player A's ship (medium < large).

### Growth Examples

**Example 6: Growth with limited bank**

- Bank contains: 1 medium red, 1 large red (no small red)
- Player has: Small red ship performing grow action

Result: Creates medium red ship (smallest available size)

**Example 7: Growth impossible**

- Bank contains: No red pieces
- Player has: Red ship attempting to grow

Result: Action cannot be performed

### Overpopulation Examples

**Example 8: Ship overpopulation**

- System: Large red star
- Player A: 2 medium blue ships
- Player B: 1 small blue ship, 1 medium yellow ship

When a 4th blue ship arrives, any player can declare overpopulation. All blue ships are returned to the bank. The system now contains only the large red star and Player B's medium yellow ship.

**Example 9: Star overpopulation causing system destruction**

- System: 1 large red star
- Player A: 2 medium red ships, 1 large green ship, 1 small yellow ship

On Player B's turn, they move a small red ship to the star and declare overpopulation. All red pieces are returned to the bank, including the large red star. The star system is destroyed, and all remaining ships (green, yellow) are also returned to the bank.

### Sacrifice Examples

**Example 10: Multiple sacrifice actions**

- Sacrifice: Large yellow ship (size 3)
- Gain: 3 yellow (move) actions
- Can use these 3 moves with any of your ships, even where yellow isn't normally available

**Example 11: Sacrifice timing**

- System: Small red star
- Player A: Medium blue ship
- Action: Player A sacrifices their blue ship for 2 blue actions

Sequence: Remove ship, return red star to the bank, then perform 2 trade actions with other ships
