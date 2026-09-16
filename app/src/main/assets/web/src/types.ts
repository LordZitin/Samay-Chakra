export enum CharacterType {
  KING = "Showoff King",
  WITCH = "Poor Witch",
  DEMON = "Demon Lord",
  MERCHANT = "Fraud Merchant",
}

export enum EventType {
  ZOMBIE_BREAKOUT = "Zombie Breakout",
  PEST_INFESTATION = "Pest Infestation",
  DROUGHT = "Drought",
  ROAD_BLOCKS = "Road Blocks",
  RAIN = "Rain",
  GOOD_HARVEST = "Good Harvest",
  MIRACLE_SAVE = "Miracle Save",
  FLOOD = "Flood",
  FERTILITY_BLESSING = "Fertility Blessing",
}

export interface CharacterStats {
  type: CharacterType;
  name: string;
  title: string;
  quote: string;
  avatarIcon: string;
  themeColor: string;
  glowColor: number;
  health: number;
  maxHealth: number;
  wealth: number;
  reputation: number;
  sanity: number;
  population: number;
  isDead: boolean;
  territoryName: string;
}

export interface EventOutcome {
  action: string;
  hp: number;
  gold: number;
  rep: number;
  san: number;
  pop: number;
}

export interface AttackWitchOutcome {
  action: string;
  attackerType: CharacterType;
  costHp: number;
  costGold: number;
  repGain: number;
  victimDrain: number;
}

export interface TurnOutcome {
  turn: number;
  event: EventType;
  eventDescription: string;
  characterOutcomes: Record<CharacterType, EventOutcome>;
  heals: Array<{ characterType: CharacterType; amount: number }>;
  attacks: AttackWitchOutcome[];
  fallenCharacters: CharacterType[];
}

export interface TerritoryInfo {
  id: string;
  owner: CharacterType;
  name: string;
  description: string;
  position: { x: number; y: number; z: number };
  color: string;
}
