import {
  CharacterType,
  EventType,
  CharacterStats,
  EventOutcome,
  AttackWitchOutcome,
  TurnOutcome,
} from "./types";

export class GameEngine {
  public characters: Record<CharacterType, CharacterStats>;
  public turn: number = 0;
  public history: TurnOutcome[] = [];
  public isGameOver: boolean = false;
  public fallen: CharacterType[] = [];

  constructor() {
    this.characters = this.initCharacters();
  }

  public initCharacters(): Record<CharacterType, CharacterStats> {
    return {
      [CharacterType.KING]: {
        type: CharacterType.KING,
        name: "King Aurelius IV",
        title: "The Showoff Monarch",
        quote: "Behold my glorious realm and swelling kingdom!",
        avatarIcon: "👑",
        themeColor: "#EAB308",
        glowColor: 0xffd700,
        health: 100,
        maxHealth: 200,
        wealth: 100,
        reputation: 80,
        sanity: 100,
        population: 5000,
        isDead: false,
        territoryName: "Sunlit Citadel",
      },
      [CharacterType.WITCH]: {
        type: CharacterType.WITCH,
        name: "Morgana the Hexed",
        title: "The Destitute Sorceress",
        quote: "They despise me until they need my elixirs...",
        avatarIcon: "🧙‍♀️",
        themeColor: "#A855F7",
        glowColor: 0x9333ea,
        health: 60,
        maxHealth: 200,
        wealth: 20,
        reputation: 40,
        sanity: 120,
        population: 500,
        isDead: false,
        territoryName: "Enchanted Fen",
      },
      [CharacterType.DEMON]: {
        type: CharacterType.DEMON,
        name: "Malakor the Judge",
        title: "The Brimstone Overlord",
        quote: "Your frail mortal lives are merely kindling for my pyre.",
        avatarIcon: "😈",
        themeColor: "#EF4444",
        glowColor: 0xdc2626,
        health: 150,
        maxHealth: 200,
        wealth: 80,
        reputation: 20,
        sanity: 100,
        population: 1000,
        isDead: false,
        territoryName: "Brimstone Abyss",
      },
      [CharacterType.MERCHANT]: {
        type: CharacterType.MERCHANT,
        name: "Barnaby Coinspinner",
        title: "The Silkroad Swindler",
        quote: "A crisis is just a seller's market in disguise!",
        avatarIcon: "🤑",
        themeColor: "#10B981",
        glowColor: 0x10b981,
        health: 70,
        maxHealth: 200,
        wealth: 60,
        reputation: 30,
        sanity: 90,
        population: 2000,
        isDead: false,
        territoryName: "Golden Bazaar",
      },
    };
  }

  public resetGame(): void {
    this.characters = this.initCharacters();
    this.turn = 0;
    this.history = [];
    this.isGameOver = false;
    this.fallen = [];
  }

  public getKingResponse(event: EventType): EventOutcome {
    const outcomes: Record<EventType, EventOutcome[]> = {
      [EventType.ZOMBIE_BREAKOUT]: [
        { action: "Rally troops and charge directly at zombies!", hp: 40, gold: -5, rep: 35, san: -10, pop: 15 },
        { action: "Strategic fortification to protect subjects", hp: 20, gold: -15, rep: 25, san: 5, pop: 25 },
        { action: "Bold but reckless charge - casualties high", hp: -20, gold: 10, rep: 45, san: -25, pop: -10 },
      ],
      [EventType.PEST_INFESTATION]: [
        { action: "Host lavish feasts celebrating pest survival", hp: 15, gold: -30, rep: 30, san: 10, pop: 20 },
        { action: "Organize pest control campaign", hp: 25, gold: -10, rep: 20, san: 5, pop: 30 },
        { action: "Ignore pests, let nobles feast anyway", hp: -10, gold: -50, rep: 15, san: -5, pop: -5 },
      ],
      [EventType.DROUGHT]: [
        { action: "Announce grand irrigation projects", hp: -25, gold: -40, rep: 30, san: -10, pop: 10 },
        { action: "Ration water to protect subjects", hp: -15, gold: -20, rep: 20, san: 5, pop: 20 },
        { action: "Hoard resources for self, people suffer", hp: 30, gold: 50, rep: -40, san: -20, pop: -30 },
      ],
      [EventType.ROAD_BLOCKS]: [
        { action: "Personally lead cavalry to clear roads", hp: 30, gold: 20, rep: 40, san: 5, pop: 25 },
        { action: "Negotiate with blockaders diplomatically", hp: 10, gold: -5, rep: 15, san: 10, pop: 15 },
        { action: "Wage direct assault", hp: -30, gold: 30, rep: 50, san: -20, pop: -20 },
      ],
      [EventType.RAIN]: [
        { action: "Declare divine blessing, boost morale", hp: 20, gold: 15, rep: 40, san: 15, pop: 30 },
        { action: "Harness rain for crops and people", hp: 15, gold: 25, rep: 30, san: 10, pop: 40 },
        { action: "Wasteful celebration of abundance", hp: 10, gold: -40, rep: 20, san: 5, pop: 20 },
      ],
      [EventType.GOOD_HARVEST]: [
        { action: "Distribute equally to all subjects", hp: 10, gold: -50, rep: 50, san: 15, pop: 50 },
        { action: "Take royal share, distribute rest fairly", hp: 15, gold: 20, rep: 30, san: 10, pop: 40 },
        { action: "Hoard most, throw crumbs to peasants", hp: 20, gold: 80, rep: -30, san: -10, pop: -20 },
      ],
      [EventType.MIRACLE_SAVE]: [
        { action: "Take credit, rally people to cause", hp: 50, gold: 60, rep: 80, san: 20, pop: 60 },
        { action: "Lead people in thanksgiving", hp: 40, gold: 30, rep: 60, san: 15, pop: 50 },
        { action: "Demand payment and loyalty for salvation", hp: 30, gold: 100, rep: 40, san: -10, pop: 10 },
      ],
      [EventType.FLOOD]: [
        { action: "Lead evacuation, save many citizens", hp: -20, gold: -30, rep: 60, san: 5, pop: 45 },
        { action: "Build emergency shelters and aid", hp: -10, gold: -20, rep: 50, san: 10, pop: 35 },
        { action: "Retreat to high ground, abandon people", hp: 50, gold: 40, rep: -50, san: -30, pop: -40 },
      ],
      [EventType.FERTILITY_BLESSING]: [
        { action: "Celebrate and encourage large families", hp: 20, gold: -20, rep: 40, san: 15, pop: 80 },
        { action: "Distribute fertility resources", hp: 10, gold: -10, rep: 30, san: 10, pop: 70 },
        { action: "Claim personal credit, become vain", hp: 15, gold: 10, rep: 20, san: -10, pop: 50 },
      ],
    };
    const list = outcomes[event];
    return list[Math.floor(Math.random() * list.length)];
  }

  public getWitchResponse(event: EventType): EventOutcome {
    const outcomes: Record<EventType, EventOutcome[]> = {
      [EventType.ZOMBIE_BREAKOUT]: [
        { action: "Hide and brew potions safely", hp: 30, gold: 5, rep: -5, san: 15, pop: 0 },
        { action: "Sell potions to desperate refugees", hp: 10, gold: 40, rep: 25, san: 5, pop: 5 },
        { action: "Drain fleeing victims for power", hp: 50, gold: 10, rep: -30, san: -10, pop: -15 },
      ],
      [EventType.PEST_INFESTATION]: [
        { action: "Cast safe transmutation spell", hp: 25, gold: 15, rep: 10, san: 10, pop: 5 },
        { action: "Offer pest-removal service to locals", hp: 5, gold: 35, rep: 30, san: 5, pop: 10 },
        { action: "Drain pest victims seeking help", hp: 45, gold: 20, rep: -20, san: -5, pop: -10 },
      ],
      [EventType.DROUGHT]: [
        { action: "Retreat to hidden sanctuary", hp: 20, gold: 0, rep: -10, san: 20, pop: 0 },
        { action: "Sell water-finding services", hp: 5, gold: 50, rep: 20, san: 10, pop: 5 },
        { action: "Drain desperate water seekers", hp: 60, gold: 30, rep: -40, san: -15, pop: -20 },
      ],
      [EventType.ROAD_BLOCKS]: [
        { action: "Use magic to find safe passages", hp: 15, gold: 10, rep: 5, san: 10, pop: 0 },
        { action: "Guide travelers through for payment", hp: 10, gold: 40, rep: 25, san: 5, pop: 5 },
        { action: "Drain travelers at her mercy", hp: 55, gold: 35, rep: -35, san: -10, pop: -15 },
      ],
      [EventType.RAIN]: [
        { action: "Shelter safely indoors", hp: 15, gold: 0, rep: 0, san: 20, pop: 0 },
        { action: "Sell shelter to rain-soaked wanderers", hp: 5, gold: 25, rep: 20, san: 10, pop: 5 },
        { action: "Force desperate shelter-seekers to trade vitality", hp: 35, gold: 20, rep: -20, san: -5, pop: -10 },
      ],
      [EventType.GOOD_HARVEST]: [
        { action: "Quietly maintain low profile", hp: 10, gold: 0, rep: 0, san: 15, pop: 0 },
        { action: "Offer preservation spells to farmers", hp: 5, gold: 45, rep: 30, san: 5, pop: 10 },
        { action: "Drain grateful but weakened farmers", hp: 50, gold: 25, rep: -25, san: -10, pop: -5 },
      ],
      [EventType.MIRACLE_SAVE]: [
        { action: "Accept gratitude from saviors", hp: 20, gold: 15, rep: 40, san: 15, pop: 10 },
        { action: "Offer healing services to injured", hp: 10, gold: 60, rep: 50, san: 10, pop: 20 },
        { action: "Drain weakened survivors", hp: 70, gold: 40, rep: -10, san: -20, pop: 0 },
      ],
      [EventType.FLOOD]: [
        { action: "Protective spell keeps self safe", hp: 25, gold: 5, rep: -15, san: 15, pop: 0 },
        { action: "Sell rescue and shelter to flood victims", hp: 10, gold: 50, rep: 35, san: 5, pop: 15 },
        { action: "Drain desperate, drowning victims", hp: 60, gold: 45, rep: -50, san: -20, pop: -25 },
      ],
      [EventType.FERTILITY_BLESSING]: [
        { action: "Hide away from crowds", hp: 15, gold: 0, rep: -5, san: 20, pop: 0 },
        { action: "Sell fertility charms and aid", hp: 5, gold: 35, rep: 30, san: 10, pop: 20 },
        { action: "Drain pregnant women for essence", hp: 70, gold: 20, rep: -60, san: -30, pop: -30 },
      ],
    };
    const list = outcomes[event];
    return list[Math.floor(Math.random() * list.length)];
  }

  public getDemonResponse(event: EventType): EventOutcome {
    const outcomes: Record<EventType, EventOutcome[]> = {
      [EventType.ZOMBIE_BREAKOUT]: [
        { action: "Ally with zombies, increase undead army", hp: 50, gold: 20, rep: 30, san: -20, pop: -40 },
        { action: "Systematically cull weak population", hp: 40, gold: 10, rep: 25, san: -15, pop: -30 },
        { action: "Negotiate with zombie lord for power share", hp: 60, gold: 30, rep: 40, san: -30, pop: -50 },
      ],
      [EventType.PEST_INFESTATION]: [
        { action: "Encourage pests to spread widely", hp: 30, gold: 15, rep: 20, san: -10, pop: -25 },
        { action: "Poison crops and herds for depopulation", hp: 35, gold: 10, rep: 25, san: -15, pop: -35 },
        { action: "Let pests take their toll, judge survivors", hp: 25, gold: 5, rep: 15, san: -5, pop: -20 },
      ],
      [EventType.DROUGHT]: [
        { action: "Sabotage water sources", hp: 40, gold: 25, rep: 30, san: -20, pop: -45 },
        { action: "Withhold aid, let weak perish", hp: 35, gold: 20, rep: 25, san: -15, pop: -40 },
        { action: "Spread plague through desperation", hp: 45, gold: 30, rep: 35, san: -25, pop: -50 },
      ],
      [EventType.ROAD_BLOCKS]: [
        { action: "Strengthen blockades, trap refugees", hp: 30, gold: 10, rep: 20, san: -10, pop: -30 },
        { action: "Recruit blockaders to demon's cause", hp: 40, gold: 15, rep: 30, san: -20, pop: -35 },
        { action: "Execute travelers seeking passage", hp: 35, gold: 20, rep: 25, san: -15, pop: -40 },
      ],
      [EventType.RAIN]: [
        { action: "Flood through sabotage, drown weak", hp: 35, gold: 15, rep: 25, san: -15, pop: -40 },
        { action: "Spread disease via contaminated water", hp: 40, gold: 20, rep: 30, san: -20, pop: -45 },
        { action: "Create deadly mudslides and chaos", hp: 45, gold: 25, rep: 35, san: -25, pop: -50 },
      ],
      [EventType.GOOD_HARVEST]: [
        { action: "Poison crops, cause mass starvation", hp: 50, gold: 30, rep: 40, san: -30, pop: -60 },
        { action: "Steal harvest, let people starve", hp: 45, gold: 50, rep: 35, san: -25, pop: -55 },
        { action: "Corrupt crops with demonic blight", hp: 55, gold: 20, rep: 45, san: -35, pop: -65 },
      ],
      [EventType.MIRACLE_SAVE]: [
        { action: "Curse those who were saved, reap havoc", hp: 60, gold: 40, rep: 50, san: -40, pop: -50 },
        { action: "Demand souls of survivors as payment", hp: 70, gold: 50, rep: 60, san: -50, pop: -60 },
        { action: "Twist mercy into suffering", hp: 65, gold: 35, rep: 55, san: -45, pop: -55 },
      ],
      [EventType.FLOOD]: [
        { action: "Amplify flood to drown entire regions", hp: 50, gold: 25, rep: 40, san: -30, pop: -60 },
        { action: "Prevent escapes, trap population", hp: 45, gold: 20, rep: 35, san: -25, pop: -55 },
        { action: "Summon water elementals to maximize death", hp: 55, gold: 30, rep: 45, san: -35, pop: -65 },
      ],
      [EventType.FERTILITY_BLESSING]: [
        { action: "Twist blessing into plague of weakness", hp: 35, gold: 15, rep: 25, san: -15, pop: -35 },
        { action: "Corrupt infants, doom next generation", hp: 40, gold: 20, rep: 30, san: -20, pop: -50 },
        { action: "Use population boom for grand sacrifice", hp: 50, gold: 30, rep: 40, san: -30, pop: -70 },
      ],
    };
    const list = outcomes[event];
    return list[Math.floor(Math.random() * list.length)];
  }

  public getMerchantResponse(event: EventType): EventOutcome {
    const outcomes: Record<EventType, EventOutcome[]> = {
      [EventType.ZOMBIE_BREAKOUT]: [
        { action: "Sell fake 'zombie repellent' at 10x markup", hp: -10, gold: 80, rep: -25, san: 5, pop: 0 },
        { action: "Rob refugees fleeing zombies", hp: 5, gold: 60, rep: -35, san: -10, pop: -5 },
        { action: "Trade weapons to both sides", hp: -15, gold: 100, rep: -40, san: 0, pop: -10 },
      ],
      [EventType.PEST_INFESTATION]: [
        { action: "Buy damaged goods cheap, resell as 'organic'", hp: 10, gold: 50, rep: -15, san: 10, pop: 0 },
        { action: "Sell ineffective pest solutions to desperate farmers", hp: 5, gold: 70, rep: -30, san: 5, pop: 0 },
        { action: "Deliberately spread pests to more areas, expand market", hp: -5, gold: 60, rep: -40, san: -10, pop: -10 },
      ],
      [EventType.DROUGHT]: [
        { action: "Hoard water, sell at 500% markup", hp: -20, gold: 120, rep: -50, san: -15, pop: -15 },
        { action: "Import expensive bottled water from distant lands", hp: 10, gold: 90, rep: -30, san: 5, pop: 0 },
        { action: "Steal from charity, resell to rich", hp: -10, gold: 100, rep: -60, san: -20, pop: -5 },
      ],
      [EventType.ROAD_BLOCKS]: [
        { action: "Find black market routes, charge premium access fees", hp: 5, gold: 70, rep: -20, san: 10, pop: 0 },
        { action: "Rob merchants using 'safe' routes", hp: 10, gold: 80, rep: -40, san: -5, pop: -5 },
        { action: "Pay blockaders to let only his goods through", hp: -5, gold: 85, rep: -25, san: 0, pop: 0 },
      ],
      [EventType.RAIN]: [
        { action: "Sell 'blessed umbrellas' at premium", hp: 15, gold: 45, rep: -10, san: 10, pop: 5 },
        { action: "Overcharge for shelter during storms", hp: 10, gold: 60, rep: -30, san: 5, pop: 0 },
        { action: "Embezzle public relief supplies", hp: 5, gold: 70, rep: -50, san: -15, pop: -10 },
      ],
      [EventType.GOOD_HARVEST]: [
        { action: "Spread shortage rumors, buy cheap, sell high", hp: 20, gold: 100, rep: -40, san: -10, pop: -10 },
        { action: "Monopolize grain market through hoarding", hp: 15, gold: 110, rep: -50, san: -15, pop: -20 },
        { action: "Exploit farmer debt for profit", hp: 10, gold: 90, rep: -35, san: -5, pop: -5 },
      ],
      [EventType.MIRACLE_SAVE]: [
        { action: "Charge 'salvation tax' on survivors", hp: 30, gold: 150, rep: -60, san: -30, pop: 0 },
        { action: "Sell 'blessing certificates' to grateful people", hp: 20, gold: 120, rep: -50, san: -20, pop: 5 },
        { action: "Promise future salvation for advance payment", hp: 25, gold: 140, rep: -55, san: -25, pop: 10 },
      ],
      [EventType.FLOOD]: [
        { action: "Sell overpriced rescue boats", hp: -20, gold: 140, rep: -70, san: -35, pop: -20 },
        { action: "Rob stranded flood victims", hp: 10, gold: 130, rep: -80, san: -40, pop: -25 },
        { action: "Hoard rescue supplies, sell at extortion prices", hp: -10, gold: 150, rep: -75, san: -38, pop: -30 },
      ],
      [EventType.FERTILITY_BLESSING]: [
        { action: "Sell fraudulent 'fertility charms'", hp: 15, gold: 60, rep: -20, san: 10, pop: 20 },
        { action: "Exploit new families with debt traps", hp: 10, gold: 75, rep: -35, san: -5, pop: 25 },
        { action: "Extort 'blessing tributes' from fertile population", hp: 20, gold: 85, rep: -40, san: -10, pop: 30 },
      ],
    };
    const list = outcomes[event];
    return list[Math.floor(Math.random() * list.length)];
  }

  public getWitchAttack(attackerType: CharacterType): AttackWitchOutcome {
    const attacks: Record<CharacterType, AttackWitchOutcome[]> = {
      [CharacterType.KING]: [
        { action: "Raid witch lair with soldiers", attackerType: CharacterType.KING, costHp: 15, costGold: 25, repGain: 20, victimDrain: 40 },
        { action: "Send knights to pillage", attackerType: CharacterType.KING, costHp: 20, costGold: 35, repGain: 25, victimDrain: 50 },
        { action: "Ambush with full force", attackerType: CharacterType.KING, costHp: 10, costGold: 15, repGain: 15, victimDrain: 30 },
      ],
      [CharacterType.DEMON]: [
        { action: "Demonic assault on witch", attackerType: CharacterType.DEMON, costHp: 20, costGold: 10, repGain: 25, victimDrain: 45 },
        { action: "Infernal magic strikes", attackerType: CharacterType.DEMON, costHp: 30, costGold: 0, repGain: 35, victimDrain: 55 },
        { action: "Casual predation", attackerType: CharacterType.DEMON, costHp: 15, costGold: 5, repGain: 20, victimDrain: 35 },
      ],
      [CharacterType.MERCHANT]: [
        { action: "Hire thugs to rob witch", attackerType: CharacterType.MERCHANT, costHp: 10, costGold: 40, repGain: 5, victimDrain: 30 },
        { action: "Organize heist of her assets", attackerType: CharacterType.MERCHANT, costHp: 15, costGold: 50, repGain: 10, victimDrain: 40 },
        { action: "Coerce her into debt", attackerType: CharacterType.MERCHANT, costHp: 5, costGold: 20, repGain: 3, victimDrain: 20 },
      ],
      [CharacterType.WITCH]: [],
    };
    const list = attacks[attackerType];
    return list[Math.floor(Math.random() * list.length)];
  }

  public spendWealthOnHealth(character: CharacterStats, amount: number): number {
    const spent = Math.min(amount, character.wealth);
    character.wealth -= spent;
    character.health = Math.min(character.maxHealth, character.health + spent);
    return spent;
  }

  public triggerEvent(event: EventType): TurnOutcome {
    this.turn += 1;
    const characterOutcomes: Record<CharacterType, EventOutcome> = {
      [CharacterType.KING]: this.getKingResponse(event),
      [CharacterType.WITCH]: this.getWitchResponse(event),
      [CharacterType.DEMON]: this.getDemonResponse(event),
      [CharacterType.MERCHANT]: this.getMerchantResponse(event),
    };

    const heals: Array<{ characterType: CharacterType; amount: number }> = [];

    // Apply stat changes for each living character
    for (const type of Object.values(CharacterType)) {
      const char = this.characters[type];
      if (char.isDead) continue;

      const outcome = characterOutcomes[type];
      char.health = Math.max(0, Math.min(char.maxHealth, char.health + outcome.hp));
      char.wealth = Math.max(0, char.wealth + outcome.gold);
      char.reputation = Math.max(0, Math.min(200, char.reputation + outcome.rep));
      char.sanity = Math.max(0, Math.min(200, char.sanity + outcome.san));
      char.population = Math.max(0, char.population + outcome.pop);

      // Rule: Spend wealth to restore health if badly damaged
      if (char.health < 30 && char.wealth > 20) {
        const spent = this.spendWealthOnHealth(char, Math.min(30, Math.floor(char.wealth / 2)));
        if (spent > 0) {
          heals.push({ characterType: type, amount: spent });
        }
      }
    }

    // Witch interactions (30% chance for King, Demon, Merchant to attack Witch)
    const attacks: AttackWitchOutcome[] = [];
    const witch = this.characters[CharacterType.WITCH];

    if (!witch.isDead) {
      const attackers = [CharacterType.KING, CharacterType.DEMON, CharacterType.MERCHANT];
      for (const attackerType of attackers) {
        const attacker = this.characters[attackerType];
        if (attacker.isDead) continue;

        if (Math.random() < 0.3) {
          const attack = this.getWitchAttack(attackerType);
          attacks.push(attack);

          // Attacker costs & gains
          attacker.health = Math.max(0, attacker.health - attack.costHp);
          attacker.wealth = Math.max(0, attacker.wealth - attack.costGold);
          attacker.reputation = Math.min(200, attacker.reputation + attack.repGain);
          attacker.population = Math.max(0, attacker.population + attack.victimDrain);

          // Witch suffers
          witch.health = Math.max(0, witch.health - Math.floor(attack.victimDrain / 2));
          witch.wealth = Math.max(0, witch.wealth - Math.floor(attack.victimDrain / 3));
        }
      }
    }

    // Check death condition
    const fallenCharacters: CharacterType[] = [];
    for (const type of Object.values(CharacterType)) {
      const char = this.characters[type];
      if (!char.isDead && char.health <= 0) {
        char.isDead = true;
        char.health = 0;
        fallenCharacters.push(type);
        if (!this.fallen.includes(type)) {
          this.fallen.push(type);
        }
      }
    }

    if (this.fallen.length > 0) {
      this.isGameOver = true;
    }

    const outcome: TurnOutcome = {
      turn: this.turn,
      event,
      eventDescription: this.getEventFlavorText(event),
      characterOutcomes,
      heals,
      attacks,
      fallenCharacters,
    };

    this.history.unshift(outcome);
    return outcome;
  }

  public getEventFlavorText(event: EventType): string {
    const descriptions: Record<EventType, string> = {
      [EventType.ZOMBIE_BREAKOUT]: "A cursed mist rises as the dead claw their way from ancestral crypts!",
      [EventType.PEST_INFESTATION]: "A dark swarm of locusts and beetles blankets the realm's farmlands!",
      [EventType.DROUGHT]: "The sun blazes without mercy. Rivers crack into dust and dry earth.",
      [EventType.ROAD_BLOCKS]: "Bandits and boulders blockade the kingdom's vital trade arteries!",
      [EventType.RAIN]: "Gentle, life-giving celestial showers bathe the realm in fresh vitality.",
      [EventType.GOOD_HARVEST]: "Golden wheat and rich fruits overflow from silos across the continent.",
      [EventType.MIRACLE_SAVE]: "Divine radiance bursts through the clouds, offering sacred salvation!",
      [EventType.FLOOD]: "Torrents rush over riverbanks, inundating valleys and lowlands in raging foam!",
      [EventType.FERTILITY_BLESSING]: "Ancient bloom spirits whisper through the air, multiplying new life!",
    };
    return descriptions[event] || "A divine shift echoes across the cosmos.";
  }
}
