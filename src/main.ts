import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CharacterType, EventType } from "./types";
import { GameEngine } from "./gameEngine";
import { Character3DFactory, CharacterMeshHandle } from "./characters3D";
import { WorldMap3D } from "./worldMap3D";
import { FX3DManager } from "./fx3D";
import { UIController } from "./ui";
import { soundFx } from "./soundFX";
import { TacticalMap2D } from "./tacticalMap2D";

class DivineInterventionApp {
  private engine: GameEngine;
  private ui: UIController;

  // 3D Engine Elements (Optional if WebGL succeeds)
  private is3DActive: boolean = false;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private controls?: OrbitControls;
  private charFactory?: Character3DFactory;
  private worldMap?: WorldMap3D;
  private fxManager?: FX3DManager;
  private characters3D: Map<CharacterType, CharacterMeshHandle> = new Map();

  // 2D Tactical Fallback
  private tacticalMap2D?: TacticalMap2D;

  // Camera Animation
  private targetCamPos: THREE.Vector3 = new THREE.Vector3(0, 18, 22);
  private targetCamLookAt: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private currentCamLookAt: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private isCameraLerping: boolean = false;

  private clock: THREE.Clock = new THREE.Clock();

  constructor() {
    this.engine = new GameEngine();

    // 1. Initialize UI First - Guarantees HUD is always visible & interactive
    const hudContainer = document.getElementById("hud-container");
    this.ui = new UIController(this.engine, {
      onEventTriggered: (event: EventType) => this.handleEventTrigger(event),
      onCharacterFocus: (type: CharacterType) => this.focusCharacter(type),
      onResetCamera: () => this.resetCamera(),
      onResetGame: () => this.resetGame(),
    });

    if (hudContainer) {
      this.ui.renderInitialUI(hudContainer);
    }

    // 2. Initialize Canvas & Graphics (Safe WebGL with 2D Tactical Fallback)
    const canvas = document.getElementById("webgl-canvas") as HTMLCanvasElement;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    this.initGraphics(canvas);

    // 3. Handle window resize
    window.addEventListener("resize", () => this.onResize());

    // 4. Start animation loop
    this.animate();
  }

  private initGraphics(canvas: HTMLCanvasElement) {
    let success3D = false;

    try {
      // Safe WebGL setup compatible with Android WebView / Mesa environments
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false, // Prevents Mesa multi-sample FBO allocation failures
        powerPreference: "default", // NEVER "high-performance" in containerized emulators
        failIfMajorPerformanceCaveat: false, // Essential for software rendering support
        precision: "mediump", // Safe precision across all mobile/Mesa drivers
        depth: true,
        stencil: false,
        alpha: false,
      });

      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false; // Disable heavy shadow maps that stress Mesa

      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0a0a16);
      this.scene.fog = new THREE.FogExp2(0x0a0a16, 0.02);

      // Camera
      const aspect = window.innerWidth / window.innerHeight;
      this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 200);
      this.camera.position.copy(this.targetCamPos);

      // Orbit Controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2.05;
      this.controls.minDistance = 6;
      this.controls.maxDistance = 50;
      this.controls.target.copy(this.targetCamLookAt);

      // Lighting & Starfield
      this.setupLighting();
      this.setupStarfield();

      // 3D World & Characters
      this.worldMap = new WorldMap3D();
      this.scene.add(this.worldMap.group);

      this.charFactory = new Character3DFactory();
      this.setupCharacters();

      this.fxManager = new FX3DManager();
      this.scene.add(this.fxManager.group);

      // Raycasting for tapping 3D characters
      this.setupRaycasting();

      // WebGL Context Loss Handlers
      canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        console.warn("WebGL context lost. Switching to Tactical 2D mode.");
        this.is3DActive = false;
        if (!this.tacticalMap2D) {
          this.tacticalMap2D = new TacticalMap2D(canvas, this.engine, (type) => this.focusCharacter(type));
        }
      });

      canvas.addEventListener("webglcontextrestored", () => {
        console.log("WebGL context restored.");
        this.is3DActive = true;
      });

      success3D = true;
      this.is3DActive = true;
      console.log("3D WebGL Realm successfully initialized.");
    } catch (err) {
      console.warn("WebGL initialization failed (Mesa / container environment). Activating 2D Tactical Realm:", err);
      success3D = false;
      this.is3DActive = false;
    }

    if (!success3D) {
      // Activate Tactical 2D Canvas Fallback
      this.tacticalMap2D = new TacticalMap2D(canvas, this.engine, (type) => {
        this.focusCharacter(type);
      });
    }
  }

  private setupLighting() {
    if (!this.scene) return;
    const ambient = new THREE.AmbientLight(0xdbeafe, 1.4);
    this.scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    sunLight.position.set(15, 25, 15);
    this.scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x818cf8, 0x1e1b4b, 0.7);
    this.scene.add(hemiLight);
  }

  private setupStarfield() {
    if (!this.scene) return;
    const starCount = 200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 60 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(radius * Math.cos(phi));
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xc7d2fe,
      size: 0.8,
      transparent: true,
      opacity: 0.8,
    });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);
  }

  private setupCharacters() {
    if (!this.scene || !this.charFactory) return;

    const positions: Record<CharacterType, THREE.Vector3> = {
      [CharacterType.KING]: new THREE.Vector3(5.5, 0.35, -5.5),
      [CharacterType.WITCH]: new THREE.Vector3(-5.5, 0.35, -5.5),
      [CharacterType.DEMON]: new THREE.Vector3(-5.5, 0.35, 5.5),
      [CharacterType.MERCHANT]: new THREE.Vector3(5.5, 0.35, 5.5),
    };

    for (const [type, pos] of Object.entries(positions)) {
      const charType = type as CharacterType;
      const stats = this.engine.characters[charType];
      const handle = this.charFactory.createCharacter(stats, pos);
      this.characters3D.set(charType, handle);
      this.scene.add(handle.group);
    }
  }

  private setupRaycasting() {
    if (!this.camera) return;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener("pointerdown", (e) => {
      if ((e.target as HTMLElement).closest(".glass-panel, .events-deck-container, button")) {
        return;
      }

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (!this.camera) return;
      raycaster.setFromCamera(mouse, this.camera);

      for (const [type, handle] of this.characters3D.entries()) {
        const intersects = raycaster.intersectObjects(handle.group.children, true);
        if (intersects.length > 0) {
          this.focusCharacter(type);
          break;
        }
      }
    });
  }

  public focusCharacter(type: CharacterType) {
    if (this.is3DActive) {
      const handle = this.characters3D.get(type);
      if (handle) {
        const charPos = handle.homePosition;
        let offset = new THREE.Vector3(0, 4.0, 5.0);
        if (type === CharacterType.KING) offset.set(-3.0, 3.5, 4.5);
        if (type === CharacterType.WITCH) offset.set(3.0, 3.5, 4.5);
        if (type === CharacterType.DEMON) offset.set(3.0, 3.5, -4.5);
        if (type === CharacterType.MERCHANT) offset.set(-3.0, 3.5, -4.5);

        this.targetCamPos.copy(charPos).add(offset);
        this.targetCamLookAt.copy(charPos).add(new THREE.Vector3(0, 1.2, 0));
        this.isCameraLerping = true;
      }
    }

    // Highlight character card in HUD
    document.querySelectorAll(".character-card").forEach((c) => c.classList.remove("selected-card"));
    document.getElementById(`card-${type.replace(/\s+/g, "-")}`)?.classList.add("selected-card");
  }

  public resetCamera() {
    this.targetCamPos.set(0, 18, 22);
    this.targetCamLookAt.set(0, 1, 0);
    this.isCameraLerping = true;
    document.querySelectorAll(".character-card").forEach((c) => c.classList.remove("selected-card"));
  }

  public handleEventTrigger(event: EventType) {
    const outcome = this.engine.triggerEvent(event);

    // Trigger Visual FX on either 3D or 2D
    if (this.is3DActive && this.fxManager) {
      this.fxManager.triggerEventFX(event);
    }
    if (this.tacticalMap2D) {
      this.tacticalMap2D.triggerEvent(event);
    }

    // Sound effect
    if (event === EventType.MIRACLE_SAVE || event === EventType.FERTILITY_BLESSING) {
      soundFx.playMiracle();
    } else if (event === EventType.RAIN || event === EventType.FLOOD) {
      soundFx.playEventStrike();
    } else if (event === EventType.GOOD_HARVEST) {
      soundFx.playCoins();
    }

    // Witch attack animations
    if (outcome.attacks.length > 0) {
      const witchHandle = this.characters3D.get(CharacterType.WITCH);
      outcome.attacks.forEach((atk) => {
        if (this.is3DActive && this.fxManager && witchHandle) {
          const attackerHandle = this.characters3D.get(atk.attackerType);
          if (attackerHandle) {
            attackerHandle.playAttackAnim(witchHandle.homePosition);
            this.fxManager.spawnAttackSquad(atk.attackerType, attackerHandle.homePosition, witchHandle.homePosition);
          }
        }
        if (this.tacticalMap2D) {
          this.tacticalMap2D.triggerAttack(atk.attackerType, CharacterType.WITCH);
        }
        soundFx.playAttack();
      });
    }

    // Update 3D character death states
    if (this.is3DActive) {
      for (const [type, handle] of this.characters3D.entries()) {
        const stats = this.engine.characters[type];
        handle.setDead(stats.isDead);
      }
    }

    // Show result in UI
    this.ui.showTurnOutcome(outcome);
  }

  public resetGame() {
    this.engine.resetGame();
    if (this.is3DActive) {
      for (const [, handle] of this.characters3D.entries()) {
        handle.setDead(false);
      }
    }
    this.ui.renderCharacters();
    this.ui.updateStats();
    this.resetCamera();
    document.getElementById("turn-banner")?.classList.add("hidden");
  }

  private onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const canvas = document.getElementById("webgl-canvas") as HTMLCanvasElement;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }

    if (this.is3DActive && this.camera && this.renderer) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    if (this.is3DActive && this.renderer && this.scene && this.camera) {
      // 3D Loop
      if (this.worldMap) this.worldMap.update(delta);
      for (const handle of this.characters3D.values()) {
        handle.update(delta);
      }
      if (this.fxManager) this.fxManager.update(delta);

      if (this.isCameraLerping) {
        this.camera.position.lerp(this.targetCamPos, 0.08);
        this.currentCamLookAt.lerp(this.targetCamLookAt, 0.08);
        if (this.controls) this.controls.target.copy(this.currentCamLookAt);

        if (
          this.camera.position.distanceTo(this.targetCamPos) < 0.1 &&
          this.currentCamLookAt.distanceTo(this.targetCamLookAt) < 0.1
        ) {
          this.isCameraLerping = false;
        }
      }

      if (this.controls) this.controls.update();
      this.renderer.render(this.scene, this.camera);
    } else if (this.tacticalMap2D) {
      // 2D Tactical Fallback Loop
      this.tacticalMap2D.render(delta);
    }
  };
}

// Start application when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  new DivineInterventionApp();
});
