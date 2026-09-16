import {
  CharacterType,
  EventType,
  CharacterStats,
  TurnOutcome,
} from "./types";
import { GameEngine } from "./gameEngine";
import { soundFx } from "./soundFX";

export interface UIEventCallbacks {
  onEventTriggered: (event: EventType) => void;
  onCharacterFocus: (type: CharacterType) => void;
  onResetCamera: () => void;
  onResetGame: () => void;
}

export class UIController {
  private engine: GameEngine;
  private callbacks: UIEventCallbacks;
  private isAutoPlaying: boolean = false;
  private autoPlayTimer: number | null = null;

  constructor(engine: GameEngine, callbacks: UIEventCallbacks) {
    this.engine = engine;
    this.callbacks = callbacks;
  }

  public renderInitialUI(container: HTMLElement) {
    container.innerHTML = `
      <div id="god-hud" class="hud-layer">
        <!-- Top Divine Bar -->
        <header class="top-bar glass-panel">
          <div class="realm-title-group">
            <span class="realm-badge">DIVINE INTERVENTION 3D</span>
            <div class="turn-counter">
              <span class="label">TURN</span>
              <span id="turn-num" class="value">0</span>
            </div>
          </div>

          <div class="god-stats-group">
            <div class="stat-pill" title="Total Realm Population">
              <span class="icon">👥</span>
              <span id="total-pop" class="val">8,500</span>
            </div>
            <div class="stat-pill" title="Total Gold in Circulation">
              <span class="icon">💰</span>
              <span id="total-gold" class="val">260</span>
            </div>
          </div>

          <div class="actions-group">
            <button id="btn-camera-reset" class="btn-icon" title="Reset Realm View">🌐</button>
            <button id="btn-sound" class="btn-icon" title="Toggle Sound">🔊</button>
            <button id="btn-auto" class="btn-primary-sm" title="Toggle Simulation Mode">▶ Auto</button>
            <button id="btn-history" class="btn-secondary-sm" title="Chronicle History">📜 Log</button>
            <button id="btn-goals" class="btn-secondary-sm" title="View Character Goals">🎯 Goals</button>
            <button id="btn-reset" class="btn-danger-sm" title="Reset Realm">🔄</button>
          </div>
        </header>

        <!-- Camera Focus Quick Switcher -->
        <div class="camera-dock glass-panel">
          <button class="cam-btn" data-cam="overview">🌐 Overview</button>
          <button class="cam-btn" data-cam="${CharacterType.KING}">👑 King</button>
          <button class="cam-btn" data-cam="${CharacterType.WITCH}">🧙‍♀️ Witch</button>
          <button class="cam-btn" data-cam="${CharacterType.DEMON}">😈 Demon</button>
          <button class="cam-btn" data-cam="${CharacterType.MERCHANT}">🤑 Merchant</button>
        </div>

        <!-- 4 Character Status Cards (Sides or Top-Center) -->
        <div id="characters-strip" class="characters-strip"></div>

        <!-- Event Result Banner (Floating Notification) -->
        <div id="turn-banner" class="turn-banner glass-panel hidden">
          <div class="banner-header">
            <h3 id="banner-event-title">Event Title</h3>
            <button id="banner-close" class="banner-close">✕</button>
          </div>
          <p id="banner-flavor" class="banner-flavor"></p>
          <div id="banner-character-reactions" class="reactions-grid"></div>
          <div id="banner-attacks" class="attacks-section hidden"></div>
          <div id="banner-heals" class="heals-section hidden"></div>
        </div>

        <!-- Bottom Divine Intervention Events Deck -->
        <footer class="events-deck-container">
          <div class="deck-header">
            <span class="deck-label">⚡ DIVINE INTERVENTION: CHOOSE EVENT TO STRIKE REALM</span>
          </div>
          <div class="events-scroll">
            <div id="events-deck" class="events-deck"></div>
          </div>
        </footer>

        <!-- History Modal -->
        <div id="history-modal" class="modal-overlay hidden">
          <div class="modal-card glass-panel">
            <div class="modal-header">
              <h2>📜 Divine Realm Chronicle</h2>
              <button class="modal-close" data-close="history-modal">✕</button>
            </div>
            <div id="history-content" class="modal-body">
              <p class="empty-text">No divine events have struck yet. Choose an event from the deck below.</p>
            </div>
          </div>
        </div>

        <!-- Goals & Lore Modal -->
        <div id="goals-modal" class="modal-overlay hidden">
          <div class="modal-card glass-panel">
            <div class="modal-header">
              <h2>🎯 Character Goals & Dynamics</h2>
              <button class="modal-close" data-close="goals-modal">✕</button>
            </div>
            <div class="modal-body goals-content">
              <div class="goal-item king-goal">
                <div class="goal-icon">👑</div>
                <div class="goal-info">
                  <h3>Showoff King: Aurelius IV</h3>
                  <p class="trait"><strong>Nature:</strong> Showoff but daring - acts proudly, takes bold risks.</p>
                  <p class="target"><strong>Goal:</strong> Maximize & protect population (the lifeblood of all stats!).</p>
                </div>
              </div>

              <div class="goal-item witch-goal">
                <div class="goal-icon">🧙‍♀️</div>
                <div class="goal-info">
                  <h3>Poor Witch: Morgana the Hexed</h3>
                  <p class="trait"><strong>Nature:</strong> Poor but talented - defensive sorceress.</p>
                  <p class="target"><strong>Goal:</strong> Protect self, drain health from attackers/contacts, sell services for gold & reputation.</p>
                </div>
              </div>

              <div class="goal-item demon-goal">
                <div class="goal-icon">😈</div>
                <div class="goal-info">
                  <h3>Demon Lord: Malakor the Judge</h3>
                  <p class="trait"><strong>Nature:</strong> Judgemental but fair - infernal harbinger.</p>
                  <p class="target"><strong>Goal:</strong> Kill population (sacrificing mortals increases all 4 of Demon's stats!).</p>
                </div>
              </div>

              <div class="goal-item merchant-goal">
                <div class="goal-icon">🤑</div>
                <div class="goal-info">
                  <h3>Fraud Merchant: Barnaby Coinspinner</h3>
                  <p class="trait"><strong>Nature:</strong> Fraudulent but brave - opportunist tycoon.</p>
                  <p class="target"><strong>Goal:</strong> Steal wealth from anyone and everyone in contact during crises.</p>
                </div>
              </div>

              <div class="interaction-rules">
                <h4>⚔️ Witch Raids & Heists</h4>
                <p>Every turn, the King, Demon, and Merchant each have a 30% chance to attack or extort the Witch. The attackers spend resources and drain the Witch's health and gold!</p>
                <h4>❤️ Survival Healing</h4>
                <p>When any character's Health drops below 30 and they have over 20 Gold, they will automatically spend gold to heal wounds.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Game Over Modal -->
        <div id="gameover-modal" class="modal-overlay hidden">
          <div class="modal-card glass-panel gameover-card">
            <h2 class="gameover-title">💀 REALM TRAGEDY: CHARACTERS FALLEN</h2>
            <div id="gameover-fallen-list" class="fallen-list"></div>
            <p>The mortal balance has collapsed. Will you restore the realm?</p>
            <button id="btn-restart-game" class="btn-primary-lg">✨ Resurrect & Reset Realm</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.renderCharacters();
    this.renderEventDeck();
    this.updateStats();
  }

  private bindEvents() {
    // Sound toggle
    const btnSound = document.getElementById("btn-sound");
    btnSound?.addEventListener("click", () => {
      soundFx.enabled = !soundFx.enabled;
      btnSound.textContent = soundFx.enabled ? "🔊" : "🔇";
    });

    // Camera reset
    document.getElementById("btn-camera-reset")?.addEventListener("click", () => {
      this.callbacks.onResetCamera();
    });

    // Camera Dock Buttons
    document.querySelectorAll(".cam-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cam = btn.getAttribute("data-cam");
        if (cam === "overview") {
          this.callbacks.onResetCamera();
        } else if (cam) {
          this.callbacks.onCharacterFocus(cam as CharacterType);
        }
      });
    });

    // Auto simulation toggle
    const btnAuto = document.getElementById("btn-auto");
    btnAuto?.addEventListener("click", () => {
      this.toggleAutoPlay();
    });

    // Modals
    document.getElementById("btn-history")?.addEventListener("click", () => {
      this.openHistoryModal();
    });

    document.getElementById("btn-goals")?.addEventListener("click", () => {
      document.getElementById("goals-modal")?.classList.remove("hidden");
    });

    document.getElementById("btn-reset")?.addEventListener("click", () => {
      if (confirm("Reset the divine realm and restore all characters?")) {
        this.callbacks.onResetGame();
      }
    });

    document.getElementById("btn-restart-game")?.addEventListener("click", () => {
      document.getElementById("gameover-modal")?.classList.add("hidden");
      this.callbacks.onResetGame();
    });

    document.querySelectorAll(".modal-close").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-close");
        if (targetId) document.getElementById(targetId)?.classList.add("hidden");
      });
    });

    document.getElementById("banner-close")?.addEventListener("click", () => {
      document.getElementById("turn-banner")?.classList.add("hidden");
    });
  }

  private toggleAutoPlay() {
    const btnAuto = document.getElementById("btn-auto");
    this.isAutoPlaying = !this.isAutoPlaying;

    if (this.isAutoPlaying) {
      if (btnAuto) {
        btnAuto.textContent = "⏸ Pause";
        btnAuto.classList.add("active");
      }
      const events = Object.values(EventType);
      this.autoPlayTimer = window.setInterval(() => {
        if (this.engine.isGameOver) {
          this.toggleAutoPlay();
          return;
        }
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        this.callbacks.onEventTriggered(randomEvent);
      }, 3500);
    } else {
      if (btnAuto) {
        btnAuto.textContent = "▶ Auto";
        btnAuto.classList.remove("active");
      }
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
        this.autoPlayTimer = null;
      }
    }
  }

  public renderCharacters() {
    const strip = document.getElementById("characters-strip");
    if (!strip) return;

    strip.innerHTML = "";
    for (const charType of Object.values(CharacterType)) {
      const char = this.engine.characters[charType];
      const card = document.createElement("div");
      card.className = `character-card glass-panel ${char.isDead ? "dead" : ""}`;
      card.id = `card-${char.type.replace(/\s+/g, "-")}`;

      const hpPct = Math.max(0, Math.min(100, (char.health / char.maxHealth) * 100));
      const isCritical = char.health < 30 && !char.isDead;

      card.innerHTML = `
        <div class="card-top">
          <span class="char-avatar">${char.avatarIcon}</span>
          <div class="char-names">
            <span class="char-title">${char.name}</span>
            <span class="char-territory">${char.territoryName}</span>
          </div>
          ${char.isDead ? '<span class="status-dead">PERISHED</span>' : ""}
        </div>

        <div class="health-bar-wrapper ${isCritical ? "critical-pulse" : ""}">
          <div class="bar-meta">
            <span>HP</span>
            <span>${char.health}/${char.maxHealth}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill hp-fill" style="width: ${hpPct}%; background-color: ${char.themeColor};"></div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-cell" title="Wealth (Gold)">
            <span class="s-icon">💰</span>
            <span class="s-val">${char.wealth}</span>
          </div>
          <div class="stat-cell" title="Reputation">
            <span class="s-icon">⭐</span>
            <span class="s-val">${char.reputation}</span>
          </div>
          <div class="stat-cell" title="Sanity">
            <span class="s-icon">🧠</span>
            <span class="s-val">${char.sanity}</span>
          </div>
          <div class="stat-cell" title="Population">
            <span class="s-icon">👥</span>
            <span class="s-val">${char.population.toLocaleString()}</span>
          </div>
        </div>

        <div class="card-footer">
          <button class="btn-focus-cam" data-char="${char.type}">Focus 3D</button>
        </div>
      `;

      card.querySelector(".btn-focus-cam")?.addEventListener("click", () => {
        this.callbacks.onCharacterFocus(char.type);
      });

      strip.appendChild(card);
    }
  }

  public renderEventDeck() {
    const deck = document.getElementById("events-deck");
    if (!deck) return;

    const eventIcons: Record<EventType, { icon: string; tag: string }> = {
      [EventType.ZOMBIE_BREAKOUT]: { icon: "🧟", tag: "Cursed Undead" },
      [EventType.PEST_INFESTATION]: { icon: "🦗", tag: "Locust Swarm" },
      [EventType.DROUGHT]: { icon: "☀️", tag: "Scorching Sun" },
      [EventType.ROAD_BLOCKS]: { icon: "🚧", tag: "Trade Blockade" },
      [EventType.RAIN]: { icon: "🌧️", tag: "Life Shower" },
      [EventType.GOOD_HARVEST]: { icon: "🌾", tag: "Abundant Crops" },
      [EventType.MIRACLE_SAVE]: { icon: "✨", tag: "Holy Radiance" },
      [EventType.FLOOD]: { icon: "🌊", tag: "Raging Waters" },
      [EventType.FERTILITY_BLESSING]: { icon: "🌸", tag: "Bloom Spirits" },
    };

    deck.innerHTML = "";
    for (const event of Object.values(EventType)) {
      const info = eventIcons[event];
      const card = document.createElement("button");
      card.className = "event-card glass-panel";
      card.innerHTML = `
        <span class="event-icon">${info.icon}</span>
        <span class="event-name">${event}</span>
        <span class="event-tag">${info.tag}</span>
        <span class="event-strike-prompt">Strike Realm ⚡</span>
      `;

      card.addEventListener("click", () => {
        if (this.engine.isGameOver) {
          alert("Characters have fallen! Please restart the realm.");
          return;
        }
        soundFx.playEventStrike();
        this.callbacks.onEventTriggered(event);
      });

      deck.appendChild(card);
    }
  }

  public showTurnOutcome(outcome: TurnOutcome) {
    const banner = document.getElementById("turn-banner");
    const titleEl = document.getElementById("banner-event-title");
    const flavorEl = document.getElementById("banner-flavor");
    const reactionsEl = document.getElementById("banner-character-reactions");
    const attacksEl = document.getElementById("banner-attacks");
    const healsEl = document.getElementById("banner-heals");

    if (!banner || !titleEl || !flavorEl || !reactionsEl || !attacksEl || !healsEl) return;

    titleEl.textContent = `Turn ${outcome.turn}: ${outcome.event}`;
    flavorEl.textContent = outcome.eventDescription;

    // Reactions grid
    reactionsEl.innerHTML = "";
    for (const charType of Object.values(CharacterType)) {
      const char = this.engine.characters[charType];
      const out = outcome.characterOutcomes[charType];
      if (!out) continue;

      const formatDelta = (val: number) => (val > 0 ? `+${val}` : `${val}`);
      const deltaClass = (val: number) => (val > 0 ? "pos" : val < 0 ? "neg" : "zero");

      const item = document.createElement("div");
      item.className = "reaction-item";
      item.innerHTML = `
        <div class="reaction-header">
          <span class="avatar">${char.avatarIcon}</span>
          <span class="title">${char.name}</span>
        </div>
        <div class="reaction-action">"${out.action}"</div>
        <div class="reaction-deltas">
          <span class="delta ${deltaClass(out.hp)}">HP ${formatDelta(out.hp)}</span>
          <span class="delta ${deltaClass(out.gold)}">Gold ${formatDelta(out.gold)}</span>
          <span class="delta ${deltaClass(out.rep)}">Rep ${formatDelta(out.rep)}</span>
          <span class="delta ${deltaClass(out.san)}">San ${formatDelta(out.san)}</span>
          <span class="delta ${deltaClass(out.pop)}">Pop ${formatDelta(out.pop)}</span>
        </div>
      `;
      reactionsEl.appendChild(item);
    }

    // Attacks section
    if (outcome.attacks.length > 0) {
      attacksEl.classList.remove("hidden");
      attacksEl.innerHTML = `
        <h4>⚔️ Witch Encounters & Raids</h4>
        ${outcome.attacks
          .map(
            (atk) => `
          <div class="attack-item">
            <strong>${atk.attackerType}</strong> launched: "${atk.action}"
            <span class="subtext">Attacker paid ${atk.costHp} HP, ${atk.costGold} Gold; drained Witch for ${Math.floor(atk.victimDrain / 2)} HP and ${Math.floor(atk.victimDrain / 3)} Gold.</span>
          </div>
        `
          )
          .join("")}
      `;
    } else {
      attacksEl.classList.add("hidden");
    }

    // Heals section
    if (outcome.heals.length > 0) {
      healsEl.classList.remove("hidden");
      healsEl.innerHTML = `
        <h4>❤️ Survival Healing</h4>
        ${outcome.heals
          .map(
            (h) => `
          <div class="heal-item">
            ${h.characterType} was badly wounded and spent <strong>${h.amount} gold</strong> to recover health!
          </div>
        `
          )
          .join("")}
      `;
    } else {
      healsEl.classList.add("hidden");
    }

    banner.classList.remove("hidden");

    // Check game over
    if (outcome.fallenCharacters.length > 0) {
      this.showGameOver(outcome.fallenCharacters);
    }

    this.renderCharacters();
    this.updateStats();
  }

  public showGameOver(fallen: CharacterType[]) {
    soundFx.playDeathBell();
    const modal = document.getElementById("gameover-modal");
    const list = document.getElementById("gameover-fallen-list");
    if (!modal || !list) return;

    list.innerHTML = fallen
      .map(
        (type) => `
      <div class="fallen-entry">
        <span>💀</span>
        <strong>${type}</strong> has perished!
      </div>
    `
      )
      .join("");

    modal.classList.remove("hidden");
  }

  public updateStats() {
    const turnEl = document.getElementById("turn-num");
    const popEl = document.getElementById("total-pop");
    const goldEl = document.getElementById("total-gold");

    if (turnEl) turnEl.textContent = this.engine.turn.toString();

    let totalPop = 0;
    let totalGold = 0;
    for (const char of Object.values(this.engine.characters)) {
      totalPop += char.population;
      totalGold += char.wealth;
    }

    if (popEl) popEl.textContent = totalPop.toLocaleString();
    if (goldEl) goldEl.textContent = totalGold.toString();
  }

  private openHistoryModal() {
    const modal = document.getElementById("history-modal");
    const content = document.getElementById("history-content");
    if (!modal || !content) return;

    if (this.engine.history.length === 0) {
      content.innerHTML = `<p class="empty-text">No divine events have struck yet.</p>`;
    } else {
      content.innerHTML = this.engine.history
        .map(
          (h) => `
        <div class="history-entry">
          <div class="h-header">
            <strong>Turn ${h.turn}: ${h.event}</strong>
          </div>
          <p class="h-flavor">${h.eventDescription}</p>
          <div class="h-actions">
            ${Object.entries(h.characterOutcomes)
              .map(
                ([char, o]) => `
              <div class="h-char-row">
                <span class="h-name">${char}:</span>
                <span class="h-act">${o.action}</span>
                <span class="h-delta">(HP ${o.hp > 0 ? "+" : ""}${o.hp}, Gold ${o.gold > 0 ? "+" : ""}${o.gold}, Pop ${o.pop > 0 ? "+" : ""}${o.pop})</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
        )
        .join("");
    }

    modal.classList.remove("hidden");
  }
}
