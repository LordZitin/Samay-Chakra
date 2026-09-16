import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CharacterType, EventType } from "./types";
import { GameEngine } from "./gameEngine";
import { Character3DFactory, CharacterMeshHandle } from "./characters3D";
import { WorldMap3D } from "./worldMap3D";
import { FX3DManager } from "./fx3D";
import { UIController } from "./ui";
import { soundFx } from "./soundFX";

class DivineInterventionApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  private engine: GameEngine;
  private charFactory: Character3DFactory;
  private worldMap: WorldMap3D;
  private fxManager: FX3DManager;
  private ui: UIController;

  private characters3D: Map<CharacterType, CharacterMeshHandle> = new Map();

  // Camera animation
  private targetCamPos: THREE.Vector3 = new THREE.Vector3(0, 18, 22);
  private targetCamLookAt: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private currentCamLookAt: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private isCameraLerping: boolean = false;

  private clock: THREE.Clock = new THREE.Clock();

  constructor() {
    this.engine = new GameEngine();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a16);
    this.scene.fog = new THREE.FogExp2(0x0a0a16, 0.02);

    // Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 200);
    this.camera.position.copy(this.targetCamPos);

    // Renderer
    const canvas = document.getElementById("webgl-canvas") as HTMLCanvasElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 50;
    this.controls.target.copy(this.targetCamLookAt);

    // Setup Lighting
    this.setupLighting();

    // Background Celestial Stars
    this.setupStarfield();

    // Setup 3D World & Characters
    this.worldMap = new WorldMap3D();
    this.scene.add(this.worldMap.group);

    this.charFactory = new Character3DFactory();
    this.setupCharacters();

    this.fxManager = new FX3DManager();
    this.scene.add(this.fxManager.group);

    // Setup UI
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

    // Window Resize
    window.addEventListener("resize", () => this.onResize());

    // Raycaster for tapping characters in 3D scene
    this.setupRaycasting();

    // Start Loop
    this.animate();
  }

  private setupLighting() {
    // Ambient Divine Light
    const ambient = new THREE.AmbientLight(0xdbeafe, 1.2);
    this.scene.add(ambient);

    // Sun Directional Light
    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    sunLight.position.set(15, 25, 15);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.camera.left = -18;
    sunLight.shadow.camera.right = 18;
    sunLight.shadow.camera.top = 18;
    sunLight.shadow.camera.bottom = -18;
    this.scene.add(sunLight);

    // Blue Rim/Hemisphere Light for depth
    const hemiLight = new THREE.HemisphereLight(0x818cf8, 0x1e1b4b, 0.7);
    this.scene.add(hemiLight);
  }

  private setupStarfield() {
    const starCount = 300;
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
      size: 0.6,
      transparent: true,
      opacity: 0.8,
    });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);
  }

  private setupCharacters() {
    // 4 Character Positions in their realms
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
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener("pointerdown", (e) => {
      // Don't intercept if clicked on HUD
      if ((e.target as HTMLElement).closest(".glass-panel, .events-deck-container, button")) {
        return;
      }

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

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
    const handle = this.characters3D.get(type);
    if (!handle) return;

    const charPos = handle.homePosition;
    let offset = new THREE.Vector3(0, 4.0, 5.0);
    if (type === CharacterType.KING) offset.set(-3.0, 3.5, 4.5);
    if (type === CharacterType.WITCH) offset.set(3.0, 3.5, 4.5);
    if (type === CharacterType.DEMON) offset.set(3.0, 3.5, -4.5);
    if (type === CharacterType.MERCHANT) offset.set(-3.0, 3.5, -4.5);

    this.targetCamPos.copy(charPos).add(offset);
    this.targetCamLookAt.copy(charPos).add(new THREE.Vector3(0, 1.2, 0));
    this.isCameraLerping = true;

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

    // 3D FX
    this.fxManager.triggerEventFX(event);

    // Sound effect according to event
    if (event === EventType.MIRACLE_SAVE || event === EventType.FERTILITY_BLESSING) {
      soundFx.playMiracle();
    } else if (event === EventType.RAIN || event === EventType.FLOOD) {
      soundFx.playEventStrike();
    } else if (event === EventType.GOOD_HARVEST) {
      soundFx.playCoins();
    }

    // Witch attack animations if any
    const witchHandle = this.characters3D.get(CharacterType.WITCH);
    if (witchHandle && outcome.attacks.length > 0) {
      outcome.attacks.forEach((atk) => {
        const attackerHandle = this.characters3D.get(atk.attackerType);
        if (attackerHandle) {
          attackerHandle.playAttackAnim(witchHandle.homePosition);
          this.fxManager.spawnAttackSquad(atk.attackerType, attackerHandle.homePosition, witchHandle.homePosition);
        }
        soundFx.playAttack();
      });
    }

    // Update 3D characters death status
    for (const [type, handle] of this.characters3D.entries()) {
      const stats = this.engine.characters[type];
      handle.setDead(stats.isDead);
    }

    // Show result in UI
    this.ui.showTurnOutcome(outcome);
  }

  public resetGame() {
    this.engine.resetGame();
    for (const [type, handle] of this.characters3D.entries()) {
      handle.setDead(false);
    }
    this.ui.renderCharacters();
    this.ui.updateStats();
    this.resetCamera();
    document.getElementById("turn-banner")?.classList.add("hidden");
  }

  private onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    // Update world map scenery animations
    this.worldMap.update(delta);

    // Update 3D characters
    for (const handle of this.characters3D.values()) {
      handle.update(delta);
    }

    // Update FX
    this.fxManager.update(delta);

    // Camera Lerp
    if (this.isCameraLerping) {
      this.camera.position.lerp(this.targetCamPos, 0.08);
      this.currentCamLookAt.lerp(this.targetCamLookAt, 0.08);
      this.controls.target.copy(this.currentCamLookAt);

      if (
        this.camera.position.distanceTo(this.targetCamPos) < 0.1 &&
        this.currentCamLookAt.distanceTo(this.targetCamLookAt) < 0.1
      ) {
        this.isCameraLerping = false;
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}

// Start application when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  new DivineInterventionApp();
});
