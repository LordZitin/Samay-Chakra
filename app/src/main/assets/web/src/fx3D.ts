import * as THREE from "three";
import { EventType, CharacterType } from "./types";

export class FX3DManager {
  public group: THREE.Group;
  private activeFX: Array<(delta: number) => boolean> = [];

  constructor() {
    this.group = new THREE.Group();
  }

  public update(delta: number) {
    this.activeFX = this.activeFX.filter((updateFn) => updateFn(delta));
  }

  // Trigger 3D visual FX for the 9 divine events
  public triggerEventFX(event: EventType) {
    switch (event) {
      case EventType.ZOMBIE_BREAKOUT:
        this.spawnZombieSwarm();
        break;
      case EventType.PEST_INFESTATION:
        this.spawnPestSwarm();
        break;
      case EventType.DROUGHT:
        this.spawnDroughtHeatwave();
        break;
      case EventType.ROAD_BLOCKS:
        this.spawnRoadBlockades();
        break;
      case EventType.RAIN:
        this.spawnRainStorm(false);
        break;
      case EventType.FLOOD:
        this.spawnRainStorm(true);
        break;
      case EventType.GOOD_HARVEST:
        this.spawnHarvestGlory();
        break;
      case EventType.MIRACLE_SAVE:
        this.spawnHolyMiracleBeam();
        break;
      case EventType.FERTILITY_BLESSING:
        this.spawnFertilityBlossoms();
        break;
    }
  }

  // 1. ZOMBIE BREAKOUT: Green mist & miniature zombies emerging
  private spawnZombieSwarm() {
    const fxGroup = new THREE.Group();
    this.group.add(fxGroup);

    const zombieMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.8 });
    const zombies: THREE.Mesh[] = [];

    for (let i = 0; i < 8; i++) {
      const zombie = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.7, 0.3), zombieMat);
      const angle = Math.random() * Math.PI * 2;
      const dist = 2 + Math.random() * 6;
      zombie.position.set(Math.cos(angle) * dist, -0.4, Math.sin(angle) * dist);
      fxGroup.add(zombie);
      zombies.push(zombie);
    }

    let elapsed = 0;
    this.activeFX.push((delta) => {
      elapsed += delta;
      zombies.forEach((z, i) => {
        if (elapsed < 1.0) {
          z.position.y = Math.min(0.6, z.position.y + delta * 1.5);
        } else {
          z.rotation.y += delta * (i % 2 === 0 ? 1 : -1);
          z.position.x += Math.sin(elapsed * 2 + i) * delta * 0.4;
          z.position.z += Math.cos(elapsed * 2 + i) * delta * 0.4;
        }
      });

      if (elapsed > 4.5) {
        this.group.remove(fxGroup);
        return false;
      }
      return true;
    });
  }

  // 2. PEST INFESTATION: Swarm of animated buzzing particles
  private spawnPestSwarm() {
    const count = 60;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = 1.0 + Math.random() * 3.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xa16207,
      size: 0.25,
      transparent: true,
      opacity: 0.9,
    });
    const pests = new THREE.Points(geo, mat);
    this.group.add(pests);

    let elapsed = 0;
    this.activeFX.push((delta) => {
      elapsed += delta;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] += Math.sin(elapsed * 10 + i) * delta * 0.8;
        arr[i * 3] += Math.cos(elapsed * 4 + i) * delta * 1.2;
        arr[i * 3 + 2] += Math.sin(elapsed * 4 + i) * delta * 1.2;
      }
      posAttr.needsUpdate = true;

      if (elapsed > 4.0) {
        this.group.remove(pests);
        return false;
      }
      return true;
    });
  }

  // 3. DROUGHT: Blazing heatwave sun
  private spawnDroughtHeatwave() {
    const sunRing = new THREE.Mesh(
      new THREE.RingGeometry(8, 9.5, 32),
      new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    sunRing.rotation.x = -Math.PI / 2;
    sunRing.position.y = 5.0;
    this.group.add(sunRing);

    let elapsed = 0;
    this.activeFX.push((delta) => {
      elapsed += delta;
      sunRing.scale.setScalar(1 + Math.sin(elapsed * 4) * 0.15);
      sunRing.rotation.z += delta * 0.5;

      if (elapsed > 3.5) {
        this.group.remove(sunRing);
        return false;
      }
      return true;
    });
  }

  // 4. ROAD BLOCKS: Barricade crates
  private spawnRoadBlockades() {
    const fxGroup = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x713f12 });
    const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];

    angles.forEach((ang) => {
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.4), mat);
      barrier.position.set(Math.sin(ang) * 4.0, 0.6, Math.cos(ang) * 4.0);
      barrier.rotation.y = ang + Math.PI / 2;
      fxGroup.add(barrier);
    });
    this.group.add(fxGroup);

    let elapsed = 0;
    this.activeFX.push((delta) => {
      elapsed += delta;
      if (elapsed > 4.0) {
        this.group.remove(fxGroup);
        return false;
      }
      return true;
    });
  }

  // 5. RAIN / FLOOD: Torrential downpour & rising water
  private spawnRainStorm(isFlood: boolean) {
    const count = isFlood ? 120 : 60;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = 4 + Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 22;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
    });
    const rain = new THREE.Points(geo, mat);
    this.group.add(rain);

    // If flood, add rising water plane
    let floodPlane: THREE.Mesh | null = null;
    if (isFlood) {
      const fGeo = new THREE.CylinderGeometry(14.5, 14.5, 0.2, 32);
      const fMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
      });
      floodPlane = new THREE.Mesh(fGeo, fMat);
      floodPlane.position.y = 0.1;
      this.group.add(floodPlane);
    }

    let elapsed = 0;
    this.activeFX.push((delta) => {
      elapsed += delta;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] -= delta * 12;
        if (arr[i * 3 + 1] < 0.2) {
          arr[i * 3 + 1] = 8 + Math.random() * 3;
        }
      }
      posAttr.needsUpdate = true;

      if (floodPlane) {
        if (elapsed < 2.0) {
          floodPlane.position.y = Math.min(0.65, floodPlane.position.y + delta * 0.25);
        } else {
          floodPlane.position.y = Math.max(0.1, floodPlane.position.y - delta * 0.3);
        }
      }

      if (elapsed > 4.5) {
        this.group.remove(rain);
        if (floodPlane) this.group.remove(floodPlane);
        return false;
      }
      return true;
    });
  }

  // 6. GOOD HARVEST: Golden wheat & coin sparkles
  private spawnHarvestGlory() {
    const fxGroup = new THREE.Group();
    this.group.add(fxGroup);

    const count = 40;
    const goldMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const sparkles: THREE.Mesh[] = [];

    for (let i = 0; i < count; i++) {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), goldMat);
      s.position.set((Math.random() - 0.5) * 16, 0.4 + Math.random() * 2, (Math.random() - 0.5) * 16);
      fxGroup.add(s);
      sparkles.push(s);
    }

    let elapsed = 0;
    this.activeFX.push((delta) => {
      elapsed += delta;
      sparkles.forEach((s) => {
        s.position.y += delta * 0.8;
        s.rotation.y += delta * 3;
      });

      if (elapsed > 3.0) {
        this.group.remove(fxGroup);
        return false;
      }
      return true;
    });
  }

  // 7. MIRACLE SAVE: Sacred celestial beam of holy light
  private spawnHolyMiracleBeam() {
    const beamGeo = new THREE.CylinderGeometry(1.8, 3.5, 12, 24, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 6.0;
    this.group.add(beam);

    const light = new THREE.PointLight(0xffffff, 3.0, 15);
    light.position.y = 4.0;
    this.group.add(light);

    let elapsed = 0;
    this.activeFX.push((delta) => {
      elapsed += delta;
      beam.rotation.y += delta * 1.5;
      beamMat.opacity = Math.max(0, 0.7 - elapsed * 0.2);

      if (elapsed > 3.5) {
        this.group.remove(beam);
        this.group.remove(light);
        return false;
      }
      return true;
    });
  }

  // 8. FERTILITY BLESSING: Pink lotus & bloom particles
  private spawnFertilityBlossoms() {
    const fxGroup = new THREE.Group();
    this.group.add(fxGroup);

    const count = 35;
    const pinkMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });
    const petals: THREE.Mesh[] = [];

    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(new THREE.TetrahedronGeometry(0.18, 0), pinkMat);
      p.position.set((Math.random() - 0.5) * 18, 0.5 + Math.random() * 3, (Math.random() - 0.5) * 18);
      fxGroup.add(p);
      petals.push(p);
    }

    let elapsed = 0;
    this.activeFX.push((delta) => {
      elapsed += delta;
      petals.forEach((p, idx) => {
        p.position.y += Math.sin(elapsed * 3 + idx) * delta * 0.5;
        p.rotation.x += delta * 2;
        p.rotation.y += delta * 1.5;
      });

      if (elapsed > 3.5) {
        this.group.remove(fxGroup);
        return false;
      }
      return true;
    });
  }

  // 9. COMBAT INTERACTION: Attack unit marching from attacker to Witch
  public spawnAttackSquad(attackerType: CharacterType, startPos: THREE.Vector3, targetPos: THREE.Vector3) {
    const squadGroup = new THREE.Group();
    squadGroup.position.copy(startPos);
    this.group.add(squadGroup);

    let unitColor = 0x2563eb;
    if (attackerType === CharacterType.DEMON) unitColor = 0xef4444;
    if (attackerType === CharacterType.MERCHANT) unitColor = 0x10b981;

    const unitGeo = new THREE.ConeGeometry(0.2, 0.5, 6);
    const unitMat = new THREE.MeshStandardMaterial({ color: unitColor });

    const unit = new THREE.Mesh(unitGeo, unitMat);
    unit.position.y = 0.5;
    unit.rotation.x = Math.PI / 4;
    squadGroup.add(unit);

    let progress = 0;
    this.activeFX.push((delta) => {
      progress += delta * 0.9;
      squadGroup.position.lerpVectors(startPos, targetPos, Math.min(1.0, progress));
      unit.rotation.z += delta * 5;

      if (progress >= 1.0) {
        this.group.remove(squadGroup);
        return false;
      }
      return true;
    });
  }
}
