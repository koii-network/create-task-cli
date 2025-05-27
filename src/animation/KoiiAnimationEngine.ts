import chalk from 'chalk';

// Types and Interfaces
interface AnimationConfig {
  frameRate: number;
  oceanWidth: number;
  maxPosition: number;
  foodSpacing: number;
  seaweedPositions: number[];
}

interface KoiiStage {
  name: string;
  sprite: string;
  description: string;
  foodRequired: number;
}

interface Position {
  x: number;
  y: number;
}

interface FoodItem {
  position: number;
  type: string;
  consumed: boolean;
}

// Animation Phase Enum
enum AnimationPhase {
  SWIMMING = 'swimming',
  WAKING = 'waking',
  EATING = 'eating',
  EVOLVING = 'evolving'
}

// Fish Entity with Evolution State
class Fish {
  private appearance: string = 'KOII';
  private evolutionLevel: number = 0;
  private evolutionLimit: number = 0;
  private maxEvolutions: number = 9;

  constructor() {
    this.appearance = 'KOII';
    this.evolutionLevel = 0;
    this.evolutionLimit = 0;
  }

  getAppearance(): string {
    return this.appearance;
  }

  getEvolutionLevel(): number {
    return this.evolutionLevel;
  }

  setEvolutionLimit(limit: number): void {
    this.evolutionLimit = limit;
  }

  canEvolve(): boolean {
    return this.evolutionLevel < this.evolutionLimit && this.evolutionLevel < this.maxEvolutions;
  }

  evolve(): boolean {
    if (!this.canEvolve()) {
      return false;
    }

    this.evolutionLevel++;
    
    if (this.evolutionLevel === 1) {
      // First evolution: KOII -> K(,°°)
      this.appearance = 'K(,°°)';
    } else {
      // Subsequent evolutions: add more ( characters
      const baseForm = 'K';
      const segments = '('.repeat(this.evolutionLevel);
      const tail = ',°°)';
      this.appearance = baseForm + segments + tail;
    }

    return true;
  }

  getEvolutionDescription(): string {
    if (this.evolutionLevel === 0) return 'Wild Koii form';
    if (this.evolutionLevel === 1) return 'First evolution with fins and body';
    return `Body segment level ${this.evolutionLevel}`;
  }

  reset(): void {
    this.appearance = 'KOII';
    this.evolutionLevel = 0;
    this.evolutionLimit = 0;
  }
}

// Koii Evolution Engine
class KoiiEvolutionEngine {
  private stages: KoiiStage[] = [
    { name: 'Initial', sprite: 'KOII', description: 'A wild Koii appears', foodRequired: 0 },
    { name: 'Basic', sprite: 'K(,°°)', description: 'First evolution with fins', foodRequired: 5 },
    { name: 'Segmented1', sprite: 'K((,°°)', description: 'Second body segment', foodRequired: 12 },
    { name: 'Segmented2', sprite: 'K(((,°°)', description: 'Third body segment', foodRequired: 22 },
    { name: 'Segmented3', sprite: 'K((((,°°)', description: 'Fourth body segment', foodRequired: 35 },
    { name: 'Segmented4', sprite: 'K(((((,°°)', description: 'Fifth body segment', foodRequired: 52 },
    { name: 'Segmented5', sprite: 'K((((((,°°)', description: 'Sixth body segment', foodRequired: 75 },
    { name: 'Segmented6', sprite: 'K(((((((,°°)', description: 'Seventh body segment', foodRequired: 105 },
    { name: 'Segmented7', sprite: 'K((((((((,°°)', description: 'Eighth body segment', foodRequired: 145 },
    { name: 'Ultimate', sprite: 'K(((((((((,°°)', description: 'Ultimate form', foodRequired: 200 }
  ];

  getCurrentStage(stageIndex: number): KoiiStage {
    return this.stages[Math.min(stageIndex, this.stages.length - 1)];
  }

  getNextStage(stageIndex: number): KoiiStage | null {
    return stageIndex < this.stages.length - 1 ? this.stages[stageIndex + 1] : null;
  }

  canEvolve(currentStage: number, foodEaten: number): boolean {
    const nextStage = this.getNextStage(currentStage);
    if (nextStage === null) return false;
    
    // Check if we have enough food and haven't already evolved at this level
    return foodEaten >= nextStage.foodRequired;
  }

  hasEvolvedAtLevel(currentStage: number, foodEaten: number): boolean {
    const currentStageData = this.getCurrentStage(currentStage);
    return foodEaten > currentStageData.foodRequired;
  }

  getTotalStages(): number {
    return this.stages.length;
  }
}

// Ocean Environment Manager
class OceanEnvironment {
  private config: AnimationConfig;
  private seaweedOffset: number = 0;
  private foodItems: FoodItem[] = [];
  private rockPositions: number[] = [];
  private coralPositions: number[] = [];
  private shellPositions: number[] = [];
  private cryptoTickers: string[] = [
    'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'TRX', 'DOT', 'MATIC',
    'LTC', 'SHIB', 'AVAX', 'UNI', 'ATOM', 'LINK', 'XMR', 'ETC', 'BCH', 'NEAR',
    'APT', 'QNT', 'ICP', 'FIL', 'VET', 'HBAR', 'ALGO', 'MANA', 'SAND', 'CRO',
    'FLOW', 'CHZ', 'EGLD', 'XTZ', 'THETA', 'AXS', 'KLAY', 'USDC', 'USDT', 'DAI',
    'KOII', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'BOME', 'POPCAT', 'MEW', 'NEIRO', 'GOAT'
  ];
  
  // Ocean floor decorations using Unicode characters
  private seaweedTypes: string[] = ['ψ', '♆', '⟡', '∿', '〜', '⩙'];  // Various seaweed shapes
  private rockTypes: string[] = ['◉', '●', '◐', '◑', '◒', '◓', '⬟', '⬢'];  // Different rock shapes
  private coralTypes: string[] = ['❋', '✱', '✲', '✳', '✴', '✵', '❅', '❆'];  // Coral formations
  private shellTypes: string[] = ['◔', '◕', '◖', '◗', '⊙', '⊚', '⊛', '⊜'];  // Shells and small objects

  constructor(config: AnimationConfig) {
    this.config = config;
    this.initializeFoodItems();
    this.initializeOceanFloorDecorations();
  }

  private initializeFoodItems(): void {
    this.foodItems = [];
    for (let i = 30; i <= this.config.maxPosition - 20; i += this.config.foodSpacing) {
      this.foodItems.push({
        position: i,
        type: this.getRandomCryptoTicker(),
        consumed: false
      });
    }
  }

  private getRandomCryptoTicker(): string {
    return this.cryptoTickers[Math.floor(Math.random() * this.cryptoTickers.length)];
  }

  updateSeaweed(): void {
    this.seaweedOffset += 1;
  }

  generateOceanFloor(): string {
    let floor = '_'.repeat(this.config.oceanWidth);
    
    this.config.seaweedPositions.forEach(pos => {
      const adjustedPos = (pos - this.seaweedOffset + this.config.oceanWidth) % this.config.oceanWidth;
      if (adjustedPos >= 0 && adjustedPos < floor.length) {
        floor = floor.substring(0, adjustedPos) + '}' + floor.substring(adjustedPos + 1);
      }
    });
    
    return floor;
  }

  generateWaterLine(): string {
    return '~'.repeat(this.config.oceanWidth);
  }

  generateFoodLine(koiiPosition: number): string {
    const windowStart = Math.max(0, Math.floor(koiiPosition) - 40);
    let foodLine = ' '.repeat(this.config.oceanWidth);
    
    this.foodItems.forEach(food => {
      if (!food.consumed) {
        const relativePos = food.position - windowStart;
        if (relativePos >= 0 && relativePos < this.config.oceanWidth - 1) {
          foodLine = foodLine.substring(0, relativePos) + '::' + foodLine.substring(relativePos + 2);
        }
      }
    });
    
    return foodLine;
  }

  checkFoodCollision(koiiPosition: number, koiiLength: number): string | null {
    const koiiEnd = koiiPosition + koiiLength;
    
    for (const food of this.foodItems) {
      if (!food.consumed && koiiPosition <= food.position && koiiEnd >= food.position) {
        food.consumed = true;
        return food.type;
      }
    }
    
    return null;
  }

  replenishFood(): void {
    const availableFood = this.foodItems.filter(food => !food.consumed).length;
    
    if (availableFood < 10) {
      const newPositions = [60, 120, 180, 240, 300, 360, 420, 480];
      newPositions.forEach(pos => {
        const existingFood = this.foodItems.find(food => food.position === pos);
        if (!existingFood) {
          this.foodItems.push({
            position: pos,
            type: this.getRandomCryptoTicker(),
            consumed: false
          });
        }
      });
    }
  }

  getRemainingFoodCount(): number {
    return this.foodItems.filter(food => !food.consumed).length;
  }
}

// Display Manager
class DisplayManager {
  private config: AnimationConfig;

  constructor(config: AnimationConfig) {
    this.config = config;
  }

  clearScreen(): void {
    console.clear();
  }

  renderHeader(title: string): void {
    console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold(`║${title.padStart(42 + Math.floor(title.length / 2)).padEnd(78)}║`));
    console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════════════╝\n'));
  }

  renderMessage(message: string, foodEaten: number, lastToken: string, showFood: boolean): void {
    const foodCounter = showFood ? ` (Food eaten: ${foodEaten})` : '';
    const tokenInfo = lastToken ? ` | Last ate: ${lastToken}` : '';
    console.log(chalk.magenta.bold((message + foodCounter + tokenInfo).padEnd(80)));
  }

  renderWaterLine(): void {
    console.log(chalk.blue.bold('~'.repeat(this.config.oceanWidth)));
  }

  renderFoodLine(foodLine: string): void {
    console.log(chalk.red.bold(foodLine));
  }

  renderKoii(koiiSprite: string, position: number, justAte: boolean): void {
    const windowStart = Math.max(0, Math.floor(position) - 40);
    const relativePosition = Math.max(0, position - windowStart);
    const spaces = ' '.repeat(Math.min(79, relativePosition));
    
    const eatingEffect = justAte ? chalk.red.bold('*') : '';
    console.log(chalk.yellow.bold(`${spaces}${koiiSprite}${eatingEffect}`));
    
    // Add fins below the fish if it has evolved past basic form
    if (koiiSprite.includes(',')) {
      const finSpaces = ' '.repeat(Math.min(79, relativePosition + koiiSprite.indexOf(',') + 1));
      console.log(chalk.yellow.bold(`${finSpaces}ˇ`));
    }
  }

  renderOceanFloor(oceanFloor: string): void {
    console.log('');
    console.log(chalk.green.bold(oceanFloor));
  }

  renderInstructions(): void {
    console.log(chalk.gray('\nPress SPACEBAR to exit and continue to CLI menu...'));
  }

  renderEvolutionBubbles(frame: number): string {
    const bubbleFrames = ['oOOo*', 'OoOO*', '*oOO*', 'O*oO*', '*OoO*', 'oO*O*', '*o*O*', 'O*o**'];
    return bubbleFrames[frame % bubbleFrames.length];
  }
}

// Input Manager
class InputManager {
  private shouldExit: boolean = false;

  constructor() {
    this.setupKeyboardInput();
  }

  private setupKeyboardInput(): void {
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', (key) => {
        if (key.toString() === ' ') {
          this.shouldExit = true;
        }
      });
    }
  }

  getShouldExit(): boolean {
    return this.shouldExit;
  }

  cleanup(): void {
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  }
}

// Main Animation Engine
export class KoiiAnimationEngine {
  private config: AnimationConfig;
  private evolutionEngine: KoiiEvolutionEngine;
  private ocean: OceanEnvironment;
  private display: DisplayManager;
  private input: InputManager;
  private fish: Fish;
  
  // Animation State
  private animationPhase: AnimationPhase = AnimationPhase.SWIMMING;
  private cycles: number = 0;
  private koiiPosition: number = 5;
  private foodEaten: number = 0;
  private lastEatenToken: string = '';
  private animationInterval: NodeJS.Timeout | null = null;
  private justEvolved: boolean = false;

  constructor(config?: Partial<AnimationConfig>) {
    this.config = {
      frameRate: 200,
      oceanWidth: 80,
      maxPosition: 490,
      foodSpacing: 20,
      seaweedPositions: [15, 25, 35, 45],
      ...config
    };

    this.evolutionEngine = new KoiiEvolutionEngine();
    this.ocean = new OceanEnvironment(this.config);
    this.display = new DisplayManager(this.config);
    this.input = new InputManager();
    this.fish = new Fish();
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.display.clearScreen();
      this.renderCurrentScene('🌊 A wild Koii appears in the ocean! 🌊', false, false);

      this.animationInterval = setInterval(() => {
        this.updateAnimation();
        
        if (this.input.getShouldExit()) {
          this.stop();
          resolve();
        }
      }, this.config.frameRate);
    });
  }

  private updateAnimation(): void {
    this.cycles++;
    this.ocean.updateSeaweed();

    switch (this.animationPhase) {
      case AnimationPhase.SWIMMING:
        this.handleSwimmingPhase();
        break;
      case AnimationPhase.WAKING:
        this.handleWakingPhase();
        break;
      case AnimationPhase.EATING:
        this.handleEatingPhase();
        break;
      case AnimationPhase.EVOLVING:
        this.handleEvolvingPhase();
        break;
    }
  }

  private handleSwimmingPhase(): void {
    if (this.cycles < 20) {
      if (this.koiiPosition < 20) this.koiiPosition += 1;
      const message = this.koiiPosition < 20 ? 
        '🏊‍♂️ The Koii swims through the ocean...' : 
        '🛑 The Koii stops and the ocean flows around it...';
      this.renderCurrentScene(message, false, false);
    } else {
      this.animationPhase = AnimationPhase.WAKING;
      this.cycles = 0;
    }
  }

  private handleWakingPhase(): void {
    if (this.cycles < 8) {
      this.renderCurrentScene('😴 The Koii is waking up! ☀️', false, false);
    } else {
      this.animationPhase = AnimationPhase.EATING;
      this.cycles = 0;
      // Keep currentStage = 0 (KOII) until first evolution
    }
  }

  private handleEatingPhase(): void {
    this.ocean.replenishFood();
    this.koiiPosition += 0.5;

    if (this.koiiPosition > this.config.maxPosition) {
      this.koiiPosition = 20;
    }

    const fishAppearance = this.fish.getAppearance();
    const eatenToken = this.ocean.checkFoodCollision(this.koiiPosition, fishAppearance.length);
    
    if (eatenToken) {
      this.foodEaten++;
      this.lastEatenToken = eatenToken;

      // Update fish evolution limit based on food eaten
      const evolutionThresholds = [1, 5, 12, 22, 35, 52, 75, 105, 145];
      let newLimit = 0;
      for (let i = 0; i < evolutionThresholds.length; i++) {
        if (this.foodEaten >= evolutionThresholds[i]) {
          newLimit = i + 1;
        }
      }
      this.fish.setEvolutionLimit(newLimit);

      if (this.fish.canEvolve() && !this.justEvolved) {
        this.animationPhase = AnimationPhase.EVOLVING;
        this.cycles = 0;
        this.justEvolved = true;
        return;
      } else {
        const currentLevel = this.fish.getEvolutionLevel();
        const nextThreshold = evolutionThresholds[currentLevel];
        const needed = nextThreshold ? Math.max(0, nextThreshold - this.foodEaten) : 0;
        this.renderCurrentScene(
          `The Koii ate ${eatenToken}! ${needed > 0 ? `Needs ${needed} more to evolve...` : 'Ready to evolve!'}`,
          true,
          true
        );
        return;
      }
    }

    this.renderCurrentScene('🍽️ The Koii hunts for food...', true, false);
  }

  private handleEvolvingPhase(): void {
    if (this.cycles < 15) {
      const bubbleSprite = this.display.renderEvolutionBubbles(this.cycles);
      const currentLevel = this.fish.getEvolutionLevel();
      
      let evolutionMessage = '';
      if (currentLevel === 0) {
        evolutionMessage = `✨ The Koii ate ${this.lastEatenToken} and is evolving! Growing fins and body! ✨`;
      } else {
        evolutionMessage = `✨ The Koii ate ${this.lastEatenToken} and is evolving! Body segment growing! ✨`;
      }

      this.renderEvolutionScene(evolutionMessage, bubbleSprite);
    } else {
      // Perform the actual evolution using the Fish object
      const evolutionSuccess = this.fish.evolve();
      
      if (evolutionSuccess) {
        const newAppearance = this.fish.getAppearance();
        const newLevel = this.fish.getEvolutionLevel();
        
        let completionMessage = '';
        if (newLevel === 1) {
          completionMessage = `🎉 Evolution complete! The Koii grew fins and body ${newAppearance}! 🎉`;
        } else {
          completionMessage = `🎉 Evolution complete! The Koii grew larger ${newAppearance}! 🎉`;
        }

        this.renderCurrentScene(completionMessage, true, false);
      }

      setTimeout(() => {
        this.animationPhase = AnimationPhase.EATING;
        this.cycles = 0;
        this.justEvolved = false; // Reset evolution flag
      }, 1000);
    }
  }

  private renderCurrentScene(message: string, showFood: boolean, justAte: boolean): void {
    this.display.clearScreen();
    this.display.renderHeader('KOII TASK CLI - LOADING...');
    this.display.renderMessage(message, this.foodEaten, this.lastEatenToken, showFood);

    if (showFood) {
      this.display.renderWaterLine();
      const foodLine = this.ocean.generateFoodLine(this.koiiPosition);
      this.display.renderFoodLine(foodLine);
    } else {
      this.display.renderWaterLine();
      console.log('');
    }

    const fishAppearance = this.fish.getAppearance();
    this.display.renderKoii(fishAppearance, this.koiiPosition, justAte);
    
    const oceanFloor = this.ocean.generateOceanFloor();
    this.display.renderOceanFloor(oceanFloor);
    this.display.renderInstructions();
  }

  private renderEvolutionScene(message: string, bubbleSprite: string): void {
    this.display.clearScreen();
    this.display.renderHeader('KOII TASK CLI - LOADING...');
    this.display.renderMessage(message, this.foodEaten, this.lastEatenToken, true);
    
    this.display.renderWaterLine();
    const foodLine = this.ocean.generateFoodLine(this.koiiPosition);
    this.display.renderFoodLine(foodLine);
    this.display.renderKoii(bubbleSprite, this.koiiPosition, false);
    
    const oceanFloor = this.ocean.generateOceanFloor();
    this.display.renderOceanFloor(oceanFloor);
    this.display.renderInstructions();
  }

  stop(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
    
    this.input.cleanup();
    
    this.display.clearScreen();
    this.display.renderHeader('KOII TASK CLI - READY!');
    
    console.log(chalk.green.bold('🚀 Animation stopped! Ready to create tasks! 🚀'));
    const finalAppearance = this.fish.getAppearance();
    console.log(chalk.cyan.bold(`Final Form: ${finalAppearance} (Food eaten: ${this.foodEaten})`));
    if (this.lastEatenToken) {
      console.log(chalk.yellow.bold(`Last crypto eaten: ${this.lastEatenToken}`));
    }
    console.log('');
  }

  // Public getters for testing and debugging
  getCurrentStage(): number {
    return this.fish.getEvolutionLevel();
  }

  getFoodEaten(): number {
    return this.foodEaten;
  }

  getKoiiPosition(): number {
    return this.koiiPosition;
  }

  getAnimationPhase(): AnimationPhase {
    return this.animationPhase;
  }
} 