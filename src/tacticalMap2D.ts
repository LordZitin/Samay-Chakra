import { CharacterType, EventType } from "./types";
import { GameEngine } from "./gameEngine";

export class TacticalMap2D {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: GameEngine;
  private onCharacterSelect: (type: CharacterType) => void;

  private stars: Array<{ x: number; y: number; s: number; a: number; v: number }> = [];
  private activeFX: Array<{ type: EventType; time: number; maxTime: number }> = [];
  private attackAnims: Array<{ from: CharacterType; to: CharacterType; progress: number }> = [];

  constructor(
    canvas: HTMLCanvasElement,
    engine: GameEngine,
    onCharacterSelect: (type: CharacterType) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.engine = engine;
    this.onCharacterSelect = onCharacterSelect;

    this.initStars();
    this.bindClick();
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        s: 1 + Math.random() * 2,
        a: 0.3 + Math.random() * 0.7,
        v: 0.5 + Math.random() * 1.5,
      });
    }
  }

  private bindClick() {
    this.canvas.addEventListener("pointerdown", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;

      const dx = clickX - cx;
      const dy = clickY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const islandRadius = Math.min(this.canvas.width, this.canvas.height) * 0.38;

      if (dist < islandRadius) {
        if (dx >= 0 && dy < 0) {
          this.onCharacterSelect(CharacterType.KING);
        } else if (dx < 0 && dy < 0) {
          this.onCharacterSelect(CharacterType.WITCH);
        } else if (dx < 0 && dy >= 0) {
          this.onCharacterSelect(CharacterType.DEMON);
        } else {
          this.onCharacterSelect(CharacterType.MERCHANT);
        }
      }
    });
  }

  public triggerEvent(event: EventType) {
    this.activeFX.push({
      type: event,
      time: 0,
      maxTime: 3.5,
    });
  }

  public triggerAttack(from: CharacterType, to: CharacterType) {
    this.attackAnims.push({
      from,
      to,
      progress: 0,
    });
  }

  public render(delta: number) {
    const ctx = this.ctx;
    if (!ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Deep space background
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h));
    bgGrad.addColorStop(0, "#0f172a");
    bgGrad.addColorStop(1, "#030712");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.fillStyle = "#cbd5e1";
    const now = Date.now() * 0.001;
    for (const star of this.stars) {
      const alpha = star.a * (0.6 + 0.4 * Math.sin(now * star.v + star.x * 10));
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(star.x * w, star.y * h, star.s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    const cx = w / 2;
    const cy = h / 2 - 10;
    const islandRadius = Math.min(w, h) * 0.36;

    // Island drop shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy + 24, islandRadius * 1.05, islandRadius * 0.65, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.filter = "blur(14px)";
    ctx.fill();
    ctx.restore();

    // Floating rock base
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 12, islandRadius, islandRadius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4 Realms on Island Top
    // 1. King (North-East: angle -pi/2 to 0)
    ctx.fillStyle = "#15803d"; // Meadow
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.ellipse(cx, cy, islandRadius, islandRadius * 0.55, 0, -Math.PI / 2, 0);
    ctx.closePath();
    ctx.fill();

    // 2. Witch (North-West: angle -pi to -pi/2)
    ctx.fillStyle = "#064e3b"; // Swamp Dark Green
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.ellipse(cx, cy, islandRadius, islandRadius * 0.55, 0, -Math.PI, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    // 3. Demon (South-West: angle pi/2 to pi)
    ctx.fillStyle = "#18181b"; // Scorched Obsidian
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.ellipse(cx, cy, islandRadius, islandRadius * 0.55, 0, Math.PI / 2, Math.PI);
    ctx.closePath();
    ctx.fill();

    // 4. Merchant (South-East: angle 0 to pi/2)
    ctx.fillStyle = "#b45309"; // Warm Sandstone
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.ellipse(cx, cy, islandRadius, islandRadius * 0.55, 0, 0, Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    // Cobblestone dividing roads
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - islandRadius, cy);
    ctx.lineTo(cx + islandRadius, cy);
    ctx.moveTo(cx, cy - islandRadius * 0.55);
    ctx.lineTo(cx, cy + islandRadius * 0.55);
    ctx.stroke();

    // Island Border ring
    ctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, islandRadius, islandRadius * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Center Crossroads & God's Obelisk
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 32, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 26, 14, 0, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ca8a04";
    ctx.stroke();

    // Obelisk
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 2);
    ctx.lineTo(cx, cy - 36);
    ctx.lineTo(cx + 8, cy - 2);
    ctx.closePath();
    ctx.fill();

    // Glowing holy gem
    const gemY = cy - 42 + Math.sin(now * 3) * 4;
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(cx, gemY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Character Centers
    const rX = islandRadius * 0.55;
    const rY = islandRadius * 0.32;

    const charCoords: Record<CharacterType, { x: number; y: number }> = {
      [CharacterType.KING]: { x: cx + rX, y: cy - rY },
      [CharacterType.WITCH]: { x: cx - rX, y: cy - rY },
      [CharacterType.DEMON]: { x: cx - rX, y: cy + rY },
      [CharacterType.MERCHANT]: { x: cx + rX, y: cy + rY },
    };

    // Draw Character Realm Landmarks & Avatars
    for (const [typeKey, pos] of Object.entries(charCoords)) {
      const type = typeKey as CharacterType;
      const char = this.engine.characters[type];

      // Realm Landmark icon
      ctx.save();
      ctx.translate(pos.x, pos.y);

      // Status aura
      if (char.isDead) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const auraGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 30);
        auraGrad.addColorStop(0, char.themeColor + "66");
        auraGrad.addColorStop(1, "transparent");
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      // Avatar Icon
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const bob = Math.sin(now * 3 + (pos.x % 5)) * 3;
      ctx.fillText(char.avatarIcon, 0, bob);

      // Name & Territory
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(char.name.split(" ")[0], 0, 22);

      // Small HP Bar
      const hpPct = Math.max(0, Math.min(1, char.health / char.maxHealth));
      const barW = 38;
      const barH = 4;
      ctx.fillStyle = "#000000";
      ctx.fillRect(-barW / 2, 30, barW, barH);
      ctx.fillStyle = char.isDead ? "#6b7280" : char.health < 30 ? "#ef4444" : char.themeColor;
      ctx.fillRect(-barW / 2, 30, barW * hpPct, barH);

      if (char.isDead) {
        ctx.font = "bold 9px sans-serif";
        ctx.fillStyle = "#ef4444";
        ctx.fillText("PERISHED", 0, 42);
      }

      ctx.restore();
    }

    // Attacks Animation
    this.attackAnims = this.attackAnims.filter((atk) => {
      atk.progress += delta * 1.2;
      const p1 = charCoords[atk.from];
      const p2 = charCoords[atk.to];

      const curX = p1.x + (p2.x - p1.x) * atk.progress;
      const curY = p1.y + (p2.y - p1.y) * atk.progress;

      ctx.fillStyle = atk.from === CharacterType.DEMON ? "#ef4444" : "#3b82f6";
      ctx.beginPath();
      ctx.arc(curX, curY, 6, 0, Math.PI * 2);
      ctx.fill();

      return atk.progress < 1.0;
    });

    // Active FX Rendering
    this.activeFX = this.activeFX.filter((fx) => {
      fx.time += delta;
      this.draw2DFX(fx.type, fx.time, fx.maxTime, cx, cy, islandRadius);
      return fx.time < fx.maxTime;
    });
  }

  private draw2DFX(
    type: EventType,
    time: number,
    maxTime: number,
    cx: number,
    cy: number,
    radius: number
  ) {
    const ctx = this.ctx;
    const progress = time / maxTime;

    switch (type) {
      case EventType.RAIN:
      case EventType.FLOOD: {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 40; i++) {
          const rx = cx + ((i * 37) % (radius * 2)) - radius;
          const ry = cy + ((i * 29 + time * 300) % (radius * 1.2)) - radius * 0.6;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 2, ry + 10);
          ctx.stroke();
        }
        break;
      }
      case EventType.ZOMBIE_BREAKOUT: {
        ctx.fillStyle = "rgba(77, 124, 15, 0.8)";
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2;
          const r = radius * 0.6 * Math.min(1, progress * 1.5);
          const zx = cx + Math.cos(ang) * r;
          const zy = cy + Math.sin(ang) * r * 0.55;
          ctx.beginPath();
          ctx.arc(zx, zy, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = "12px sans-serif";
          ctx.fillText("🧟", zx, zy);
        }
        break;
      }
      case EventType.GOOD_HARVEST: {
        ctx.font = "14px sans-serif";
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2 + time;
          const r = radius * 0.7;
          ctx.fillText("💰", cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * 0.55 - time * 15);
        }
        break;
      }
      case EventType.MIRACLE_SAVE: {
        ctx.fillStyle = `rgba(254, 240, 138, ${Math.max(0, 0.6 - progress * 0.6)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.85, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case EventType.DROUGHT: {
        ctx.strokeStyle = `rgba(249, 115, 22, ${Math.sin(time * 6) * 0.4 + 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius * 0.9, radius * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case EventType.FERTILITY_BLESSING: {
        ctx.font = "14px sans-serif";
        for (let i = 0; i < 10; i++) {
          const px = cx + ((i * 41) % (radius * 1.6)) - radius * 0.8;
          const py = cy + Math.sin(time * 2 + i) * radius * 0.4;
          ctx.fillText("🌸", px, py);
        }
        break;
      }
    }
  }
}
