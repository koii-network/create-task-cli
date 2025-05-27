# KOII Animation Architecture Documentation

## Overview

This document describes the refactored object-oriented architecture for the KOII Task CLI animation system. The new design provides better separation of concerns, maintainability, and extensibility compared to the original procedural implementation.

## Architecture Comparison

### Original Implementation (`src/main.ts`)
- **Structure**: Procedural, single large function
- **Maintainability**: Difficult to modify and extend
- **Testing**: Hard to unit test individual components
- **Reusability**: Tightly coupled, not reusable

### New OOP Implementation (`src/animation/KoiiAnimationEngine.ts`)
- **Structure**: Object-oriented with clear separation of concerns
- **Maintainability**: Easy to modify individual components
- **Testing**: Each class can be unit tested independently
- **Reusability**: Modular design allows for easy reuse and extension

## Class Architecture

### 1. KoiiAnimationEngine (Main Controller)
**Purpose**: Orchestrates the entire animation system
**Responsibilities**:
- Manages animation state and lifecycle
- Coordinates between all subsystems
- Handles the main animation loop
- Provides public API for external usage

**Key Methods**:
- `start()`: Begins the animation
- `stop()`: Cleanly stops the animation
- `updateAnimation()`: Main animation loop logic
- Public getters for debugging and testing

### 2. KoiiEvolutionEngine (Evolution Logic)
**Purpose**: Manages Koii evolution stages and requirements
**Responsibilities**:
- Defines evolution stages and their properties
- Calculates evolution requirements
- Determines when evolution can occur
- Provides stage information

**Key Features**:
- Immutable stage definitions
- Clean evolution logic
- Type-safe stage management

### 3. OceanEnvironment (Environment Management)
**Purpose**: Manages the ocean environment and food system
**Responsibilities**:
- Food item generation and management
- Ocean floor and seaweed rendering
- Collision detection
- Food replenishment logic

**Key Features**:
- Configurable food spacing and positioning
- Efficient collision detection
- Dynamic food replenishment
- Crypto ticker integration

### 4. DisplayManager (Rendering System)
**Purpose**: Handles all visual rendering and display logic
**Responsibilities**:
- Screen clearing and rendering
- Header and message formatting
- Koii sprite rendering with effects
- Ocean environment visualization

**Key Features**:
- Consistent visual styling
- Configurable display parameters
- Eating effects and animations
- Evolution bubble effects

### 5. InputManager (Input Handling)
**Purpose**: Manages user input and keyboard events
**Responsibilities**:
- Keyboard input setup and cleanup
- Exit condition handling
- Input state management

**Key Features**:
- Clean input setup/teardown
- Graceful exit handling
- Cross-platform compatibility

## Configuration System

The new architecture uses a comprehensive configuration system:

```typescript
interface AnimationConfig {
  frameRate: number;        // Animation speed (ms between frames)
  oceanWidth: number;       // Width of the ocean display
  maxPosition: number;      // Maximum position before reset
  foodSpacing: number;      // Distance between food items
  seaweedPositions: number[]; // Positions of seaweed elements
}
```

## Usage Examples

### Basic Usage
```typescript
import { KoiiAnimationEngine } from './animation/KoiiAnimationEngine';

const engine = new KoiiAnimationEngine();
await engine.start();
```

### Custom Configuration
```typescript
const engine = new KoiiAnimationEngine({
  frameRate: 150,     // Faster animation
  foodSpacing: 15,    // More food
  maxPosition: 400    // Smaller ocean
});
await engine.start();
```

### Testing and Debugging
```typescript
const engine = new KoiiAnimationEngine();
await engine.start();

// Access state for testing
console.log(`Stage: ${engine.getCurrentStage()}`);
console.log(`Food Eaten: ${engine.getFoodEaten()}`);
console.log(`Position: ${engine.getKoiiPosition()}`);
```

## File Structure

```
src/
├── animation/
│   └── KoiiAnimationEngine.ts    # Main OOP animation engine
├── main.ts                       # Original procedural version
└── main-oop.ts                   # New main file using OOP engine

test-oop-animation.js             # Test file for OOP version
watch-oop-animation.js            # Auto-watch system for OOP development
```

## NPM Scripts

### Development Scripts
- `npm run start-oop`: Run the OOP version of the CLI
- `npm run watch-oop`: Auto-watch and test OOP animation on file changes
- `npm run test-oop`: Test the OOP animation engine

### Legacy Scripts (Still Available)
- `npm run start`: Run the original procedural version
- `npm run watch`: Auto-watch original animation
- `npm run test-animation`: Test original animation

## Benefits of the New Architecture

### 1. Separation of Concerns
Each class has a single, well-defined responsibility:
- Evolution logic is isolated in `KoiiEvolutionEngine`
- Environment management is handled by `OceanEnvironment`
- Display logic is contained in `DisplayManager`
- Input handling is managed by `InputManager`

### 2. Testability
Each component can be unit tested independently:
```typescript
// Test evolution logic
const evolutionEngine = new KoiiEvolutionEngine();
expect(evolutionEngine.canEvolve(1, 2)).toBe(true);

// Test environment
const ocean = new OceanEnvironment(config);
expect(ocean.checkFoodCollision(10, 5)).toBe('BTC');
```

### 3. Configurability
The system is highly configurable through the `AnimationConfig` interface, allowing for:
- Different animation speeds
- Various ocean sizes
- Custom food distributions
- Flexible seaweed positioning

### 4. Maintainability
- Clear class boundaries make it easy to modify specific functionality
- TypeScript provides compile-time type checking
- Consistent naming conventions and documentation
- Modular design allows for easy feature additions

### 5. Reusability
- Classes can be reused in different contexts
- Configuration system allows for multiple animation variants
- Clean interfaces enable easy integration with other systems

## Evolution Stages

The new system maintains the corrected evolution stages:

1. **KOII** (Stage 0) - Initial form
2. **KO** (Stage 1) - Basic form after waking  
3. **KO°°)** (Stage 2) - Gains eyes and tail
4. **K(°°)** (Stage 3) - First body segment
5. **K((°°)** (Stage 4) - Second body segment
6. **K(((°°)** (Stage 5) - Third body segment
7. **K((((°°)** (Stage 6) - Fourth body segment
8. **K(((((°°)** (Stage 7) - Fifth body segment
9. **K((((((°°)** (Stage 8) - Sixth body segment
10. **K(((((((°°)** (Stage 9) - Ultimate form

## Food Requirements

Evolution requirements follow a 1.5x scaling pattern:
- Stage 1→2: 2 food
- Stage 2→3: 3 food  
- Stage 3→4: 5 food
- Stage 4→5: 8 food
- Stage 5→6: 12 food
- Stage 6→7: 18 food
- Stage 7→8: 27 food
- Stage 8→9: 41 food

## Future Enhancements

The new architecture makes it easy to add:

1. **Multiple Animation Themes**: Different ocean environments
2. **Sound Effects**: Audio integration through a new `AudioManager`
3. **Particle Effects**: Enhanced visual effects
4. **Save/Load System**: Animation state persistence
5. **Multiplayer**: Multiple Koii in the same ocean
6. **Custom Sprites**: User-defined Koii appearances
7. **Achievement System**: Unlock new features through gameplay

## Migration Guide

### For Developers
1. Use `npm run start-oop` instead of `npm run start` for the new version
2. Import from `./animation/KoiiAnimationEngine` for programmatic usage
3. Use the configuration system for customization
4. Leverage the public getters for testing and debugging

### For Testing
1. Use `npm run test-oop` for testing the new system
2. Use `npm run watch-oop` for development with auto-reload
3. Both versions remain available for comparison

## Conclusion

The new object-oriented architecture provides a solid foundation for future development while maintaining all the functionality of the original system. The modular design, comprehensive configuration system, and clean separation of concerns make it significantly easier to maintain, test, and extend the animation system. 