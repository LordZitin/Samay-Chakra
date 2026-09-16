import * as THREE from "three";
import { CharacterType, CharacterStats } from "./types";

export interface CharacterMeshHandle {
  type: CharacterType;
  group: THREE.Group;
  bodyMesh: THREE.Object3D;
  weaponMesh?: THREE.Object3D;
  leftArm?: THREE.Object3D;
  rightArm?: THREE.Object3D;
  head?: THREE.Object3D;
  accessories?: THREE.Object3D[];
  pedestal: THREE.Mesh;
  glowAura: THREE.Mesh;
  pointLight: THREE.PointLight;
  homePosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  animTime: number;
  isAttacking: boolean;
  isDead: boolean;
  update: (delta: number) => void;
  playAttackAnim: (targetPos: THREE.Vector3) => void;
  setDead: (dead: boolean) => void;
}

export class Character3DFactory {
  // Shared materials for performance
  private matGold: THREE.MeshStandardMaterial;
  private matSteel: THREE.MeshStandardMaterial;
  private matRuby: THREE.MeshStandardMaterial;
  private matEmerald: THREE.MeshStandardMaterial;
  private matWood: THREE.MeshStandardMaterial;
  private matSkin: THREE.MeshStandardMaterial;

  constructor() {
    this.matGold = new THREE.MeshStandardMaterial({
      color: 0xffb800,
      metalness: 0.85,
      roughness: 0.25,
    });
    this.matSteel = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.9,
      roughness: 0.2,
    });
    this.matRuby = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x7f1d1d,
      roughness: 0.1,
      metalness: 0.3,
    });
    this.matEmerald = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x064e3b,
      roughness: 0.2,
      metalness: 0.4,
    });
    this.matWood = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.8,
    });
    this.matSkin = new THREE.MeshStandardMaterial({
      color: 0xfbcfe8,
      roughness: 0.6,
    });
  }

  public createCharacter(stats: CharacterStats, position: THREE.Vector3): CharacterMeshHandle {
    switch (stats.type) {
      case CharacterType.KING:
        return this.createKing(position);
      case CharacterType.WITCH:
        return this.createWitch(position);
      case CharacterType.DEMON:
        return this.createDemon(position);
      case CharacterType.MERCHANT:
        return this.createMerchant(position);
    }
  }

  // Helper for creating base pedestal
  private createPedestal(colorHex: number, glowHex: number): { pedestal: THREE.Mesh; glow: THREE.Mesh } {
    const geo = new THREE.CylinderGeometry(1.5, 1.7, 0.4, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.3,
      metalness: 0.6,
    });
    const pedestal = new THREE.Mesh(geo, mat);
    pedestal.position.y = 0.2;
    pedestal.receiveShadow = true;
    pedestal.castShadow = true;

    // Glowing rim
    const rimGeo = new THREE.TorusGeometry(1.6, 0.08, 16, 48);
    const rimMat = new THREE.MeshBasicMaterial({ color: glowHex });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.38;
    pedestal.add(rim);

    // Subtle aura plane on ground
    const auraGeo = new THREE.RingGeometry(1.6, 2.2, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: glowHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const glow = new THREE.Mesh(auraGeo, auraMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.05;

    return { pedestal, glow };
  }

  // 1. SHOWOFF KING
  private createKing(pos: THREE.Vector3): CharacterMeshHandle {
    const group = new THREE.Group();
    group.position.copy(pos);

    const { pedestal, glow } = this.createPedestal(0x1e3a8a, 0xfacc15);
    group.add(pedestal);
    group.add(glow);

    const charRoot = new THREE.Group();
    charRoot.position.y = 0.4;
    group.add(charRoot);

    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.7, 12), legMat);
    leftLeg.position.set(-0.35, 0.35, 0);
    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.35;
    charRoot.add(leftLeg, rightLeg);

    // Golden boots
    const bootGeo = new THREE.BoxGeometry(0.3, 0.25, 0.4);
    const leftBoot = new THREE.Mesh(bootGeo, this.matGold);
    leftBoot.position.set(-0.35, 0.12, 0.05);
    const rightBoot = leftBoot.clone();
    rightBoot.position.x = 0.35;
    charRoot.add(leftBoot, rightBoot);

    // Body (Royal Blue with Gold trim)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 1.1, 16), bodyMat);
    body.position.y = 1.1;
    body.castShadow = true;
    charRoot.add(body);

    // Gold breastplate & belt
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.15, 16), this.matGold);
    belt.position.y = 0.75;
    charRoot.add(belt);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), this.matSkin);
    head.position.y = 1.95;
    head.castShadow = true;
    charRoot.add(head);

    // Mustache / Beard
    const beard = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.15), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    beard.position.set(0, 1.85, 0.36);
    charRoot.add(beard);

    // Crown (Golden with 5 jewels)
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, 2.3, 0);
    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.2, 16), this.matGold);
    crownGroup.add(crownBase);

    // Crown Spikes
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 6), this.matGold);
      spike.position.set(Math.sin(angle) * 0.38, 0.22, Math.cos(angle) * 0.38);
      crownGroup.add(spike);

      // Jewel
      const gem = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), i % 2 === 0 ? this.matRuby : this.matEmerald);
      gem.position.set(Math.sin(angle) * 0.4, 0.05, Math.cos(angle) * 0.4);
      crownGroup.add(gem);
    }
    charRoot.add(crownGroup);

    // Royal Cape (Red velvet)
    const capeGeo = new THREE.BoxGeometry(1.0, 1.3, 0.08);
    const capeMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 1.15, -0.45);
    cape.rotation.x = 0.1;
    charRoot.add(cape);

    // Ermine Collar
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.12, 8, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 1.65;
    charRoot.add(collar);

    // Arms
    const armMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 10), armMat);
    leftArm.position.set(-0.75, 1.25, 0);
    leftArm.rotation.z = 0.2;
    charRoot.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.75, 1.4, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 10), armMat);
    rightArmMesh.position.y = -0.3;
    rightArm.add(rightArmMesh);
    charRoot.add(rightArm);

    // Broadsword in right hand
    const swordGroup = new THREE.Group();
    swordGroup.position.set(0, -0.6, 0.2);
    swordGroup.rotation.x = Math.PI / 4;
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8), this.matWood);
    const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.1), this.matGold);
    crossguard.position.y = 0.2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.3, 0.04), this.matSteel);
    blade.position.y = 0.9;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 4), this.matSteel);
    tip.position.y = 1.6;
    tip.rotation.y = Math.PI / 4;
    swordGroup.add(hilt, crossguard, blade, tip);
    rightArm.add(swordGroup);

    // Point Light (Golden Royal Radiance)
    const pointLight = new THREE.PointLight(0xfef08a, 1.2, 5);
    pointLight.position.set(0, 2.5, 1);
    group.add(pointLight);

    const handle: CharacterMeshHandle = {
      type: CharacterType.KING,
      group,
      bodyMesh: charRoot,
      weaponMesh: swordGroup,
      rightArm,
      head,
      accessories: [crownGroup, cape],
      pedestal,
      glowAura: glow,
      pointLight,
      homePosition: pos.clone(),
      targetPosition: pos.clone(),
      animTime: 0,
      isAttacking: false,
      isDead: false,
      update(delta: number) {
        if (this.isDead) return;
        this.animTime += delta;
        // Breathing & sword waving
        charRoot.position.y = 0.4 + Math.sin(this.animTime * 3) * 0.05;
        crownGroup.rotation.y = this.animTime * 0.5;
        cape.rotation.x = 0.1 + Math.sin(this.animTime * 4) * 0.08;
        if (!this.isAttacking) {
          rightArm.rotation.x = Math.sin(this.animTime * 2.5) * 0.2;
          rightArm.rotation.z = -0.2 + Math.cos(this.animTime * 2) * 0.1;
        }
        glow.scale.setScalar(1 + Math.sin(this.animTime * 2) * 0.05);
      },
      playAttackAnim(targetPos: THREE.Vector3) {
        this.isAttacking = true;
        // Sword swing lunge
        let progress = 0;
        const startPos = group.position.clone();
        const dir = targetPos.clone().sub(startPos).normalize().multiplyScalar(1.5);
        const lungePos = startPos.clone().add(dir);

        const swing = () => {
          progress += 0.06;
          if (progress <= 0.5) {
            group.position.lerpVectors(startPos, lungePos, progress * 2);
            rightArm.rotation.x = Math.PI / 2;
          } else if (progress <= 1.0) {
            group.position.lerpVectors(lungePos, startPos, (progress - 0.5) * 2);
            rightArm.rotation.x = -Math.PI / 4;
          } else {
            group.position.copy(startPos);
            this.isAttacking = false;
            return;
          }
          requestAnimationFrame(swing);
        };
        swing();
      },
      setDead(dead: boolean) {
        this.isDead = dead;
        if (dead) {
          charRoot.rotation.z = Math.PI / 2;
          charRoot.position.y = 0.4;
          pointLight.intensity = 0.1;
          glow.visible = false;
        } else {
          charRoot.rotation.z = 0;
          pointLight.intensity = 1.2;
          glow.visible = true;
        }
      },
    };

    return handle;
  }

  // 2. POOR WITCH
  private createWitch(pos: THREE.Vector3): CharacterMeshHandle {
    const group = new THREE.Group();
    group.position.copy(pos);

    const { pedestal, glow } = this.createPedestal(0x4a044e, 0xc084fc);
    group.add(pedestal);
    group.add(glow);

    const charRoot = new THREE.Group();
    charRoot.position.y = 0.4;
    group.add(charRoot);

    // Robe (Dark violet cone)
    const robeMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.5 });
    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 16), robeMat);
    robe.position.y = 0.7;
    charRoot.add(robe);

    // Apron / Patchwork details
    const patchMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.7 });
    const patch = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.05), patchMat);
    patch.position.set(0.1, 0.6, 0.4);
    charRoot.add(patch);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf3e8ff, roughness: 0.6 }));
    head.position.y = 1.6;
    charRoot.add(head);

    // Witch Hat (Conical crooked with buckle)
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 1.85, 0);

    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.06, 24), new THREE.MeshStandardMaterial({ color: 0x3b0764 }));
    hatGroup.add(brim);

    const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.1, 16), new THREE.MeshStandardMaterial({ color: 0x2e1065 }));
    hatCone.position.set(0, 0.55, 0);
    hatCone.rotation.z = -0.15;
    hatCone.rotation.x = -0.1;
    hatGroup.add(hatCone);

    // Hat Buckle
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.08), this.matGold);
    buckle.position.set(0, 0.15, 0.42);
    hatGroup.add(buckle);
    charRoot.add(hatGroup);

    // Magic Staff in right hand
    const staffGroup = new THREE.Group();
    staffGroup.position.set(0.65, 0.8, 0.3);

    const staffShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.0, 10), this.matWood);
    staffShaft.rotation.z = -0.1;
    staffGroup.add(staffShaft);

    // Glowing Emerald Crystal top
    const crystalGeo = new THREE.OctahedronGeometry(0.25, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      roughness: 0.1,
      metalness: 0.8,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(0.1, 1.05, 0);
    staffGroup.add(crystal);
    charRoot.add(staffGroup);

    // Floating Spellbook in left hand
    const bookGroup = new THREE.Group();
    bookGroup.position.set(-0.6, 1.1, 0.4);
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.12), new THREE.MeshStandardMaterial({ color: 0x701a75 }));
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.46, 0.1), new THREE.MeshStandardMaterial({ color: 0xfef08a }));
    bookGroup.add(cover, pages);
    charRoot.add(bookGroup);

    // Arcane Floating Ring Particles around base
    const ringGeo = new THREE.TorusGeometry(1.2, 0.03, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const arcaneRing = new THREE.Mesh(ringGeo, ringMat);
    arcaneRing.rotation.x = Math.PI / 2;
    arcaneRing.position.y = 0.2;
    group.add(arcaneRing);

    // Purple/Emerald mystic light
    const pointLight = new THREE.PointLight(0xa855f7, 1.5, 6);
    pointLight.position.set(0.65, 2.0, 0.3);
    group.add(pointLight);

    const handle: CharacterMeshHandle = {
      type: CharacterType.WITCH,
      group,
      bodyMesh: charRoot,
      weaponMesh: staffGroup,
      accessories: [hatGroup, bookGroup, crystal, arcaneRing],
      pedestal,
      glowAura: glow,
      pointLight,
      homePosition: pos.clone(),
      targetPosition: pos.clone(),
      animTime: 0,
      isAttacking: false,
      isDead: false,
      update(delta: number) {
        if (this.isDead) return;
        this.animTime += delta;
        // Hovering gently
        charRoot.position.y = 0.5 + Math.sin(this.animTime * 2.5) * 0.12;
        bookGroup.position.y = 1.1 + Math.cos(this.animTime * 3) * 0.08;
        bookGroup.rotation.y = Math.sin(this.animTime * 2) * 0.3;
        crystal.rotation.y = this.animTime * 2;
        crystal.rotation.x = this.animTime * 1.5;
        arcaneRing.rotation.z = this.animTime * 0.8;
        pointLight.intensity = 1.2 + Math.sin(this.animTime * 5) * 0.4;
      },
      playAttackAnim(targetPos: THREE.Vector3) {
        this.isAttacking = true;
        // Staff channel burst
        let time = 0;
        const spellBurst = () => {
          time += 0.05;
          staffGroup.rotation.x = -Math.sin(time * Math.PI) * 0.6;
          crystal.scale.setScalar(1 + Math.sin(time * Math.PI) * 1.5);
          pointLight.intensity = 2.5;
          if (time < 1.0) {
            requestAnimationFrame(spellBurst);
          } else {
            crystal.scale.setScalar(1);
            pointLight.intensity = 1.5;
            this.isAttacking = false;
          }
        };
        spellBurst();
      },
      setDead(dead: boolean) {
        this.isDead = dead;
        if (dead) {
          charRoot.rotation.z = -Math.PI / 2;
          charRoot.position.y = 0.3;
          pointLight.intensity = 0.1;
          glow.visible = false;
        } else {
          charRoot.rotation.z = 0;
          pointLight.intensity = 1.5;
          glow.visible = true;
        }
      },
    };

    return handle;
  }

  // 3. DEMON LORD
  private createDemon(pos: THREE.Vector3): CharacterMeshHandle {
    const group = new THREE.Group();
    group.position.copy(pos);

    const { pedestal, glow } = this.createPedestal(0x450a0a, 0xef4444);
    group.add(pedestal);
    group.add(glow);

    const charRoot = new THREE.Group();
    charRoot.position.y = 0.4;
    group.add(charRoot);

    // Muscular Crimson Body
    const demonSkin = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.3 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.6), demonSkin);
    torso.position.y = 1.1;
    charRoot.add(torso);

    // Obsidian Spiked Pauldrons
    const pauldronMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.2, metalness: 0.7 });
    const leftP = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 6), pauldronMat);
    leftP.position.set(-0.7, 1.7, 0);
    leftP.rotation.z = 0.5;
    const rightP = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 6), pauldronMat);
    rightP.position.set(0.7, 1.7, 0);
    rightP.rotation.z = -0.5;
    charRoot.add(leftP, rightP);

    // Head with glowing eyes
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), demonSkin);
    head.position.y = 2.0;
    charRoot.add(head);

    // Fiery Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.08), eyeMat);
    leftEye.position.set(-0.18, 2.05, 0.33);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.18;
    charRoot.add(leftEye, rightEye);

    // Curved Obsidian Horns
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.9, 8), hornMat);
    leftHorn.position.set(-0.35, 2.5, 0);
    leftHorn.rotation.z = 0.4;
    leftHorn.rotation.x = -0.2;
    const rightHorn = leftHorn.clone();
    rightHorn.position.x = 0.35;
    rightHorn.rotation.z = -0.4;
    charRoot.add(leftHorn, rightHorn);

    // Bat Wings
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, side: THREE.DoubleSide });
    const leftWing = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.4, 4), wingMat);
    leftWing.position.set(-0.8, 1.5, -0.4);
    leftWing.rotation.z = 0.7;
    leftWing.scale.z = 0.1;
    const rightWing = leftWing.clone();
    rightWing.position.x = 0.8;
    rightWing.rotation.z = -0.7;
    charRoot.add(leftWing, rightWing);

    // Hellfire Trident
    const tridentGroup = new THREE.Group();
    tridentGroup.position.set(0.8, 0.8, 0.3);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), pauldronMat);
    tridentGroup.add(shaft);

    const prongCenter = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.6, 6), this.matRuby);
    prongCenter.position.y = 1.25;
    const prongLeft = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 6), this.matRuby);
    prongLeft.position.set(-0.25, 1.15, 0);
    prongLeft.rotation.z = -0.15;
    const prongRight = prongLeft.clone();
    prongRight.position.x = 0.25;
    prongRight.rotation.z = 0.15;
    tridentGroup.add(prongCenter, prongLeft, prongRight);
    charRoot.add(tridentGroup);

    // Fiery Red Point Light
    const pointLight = new THREE.PointLight(0xef4444, 1.8, 7);
    pointLight.position.set(0, 2.5, 1);
    group.add(pointLight);

    const handle: CharacterMeshHandle = {
      type: CharacterType.DEMON,
      group,
      bodyMesh: charRoot,
      weaponMesh: tridentGroup,
      accessories: [leftWing, rightWing, leftHorn, rightHorn],
      pedestal,
      glowAura: glow,
      pointLight,
      homePosition: pos.clone(),
      targetPosition: pos.clone(),
      animTime: 0,
      isAttacking: false,
      isDead: false,
      update(delta: number) {
        if (this.isDead) return;
        this.animTime += delta;
        // Menacing floating & wing flap
        charRoot.position.y = 0.6 + Math.sin(this.animTime * 3) * 0.15;
        leftWing.rotation.y = Math.sin(this.animTime * 6) * 0.4;
        rightWing.rotation.y = -Math.sin(this.animTime * 6) * 0.4;
        tridentGroup.rotation.z = Math.sin(this.animTime * 2) * 0.1;
      },
      playAttackAnim(targetPos: THREE.Vector3) {
        this.isAttacking = true;
        // Menacing thrust
        let time = 0;
        const thrust = () => {
          time += 0.08;
          tridentGroup.position.z = 0.3 + Math.sin(time * Math.PI) * 1.2;
          tridentGroup.rotation.x = Math.PI / 4;
          if (time < 1.0) {
            requestAnimationFrame(thrust);
          } else {
            tridentGroup.position.z = 0.3;
            tridentGroup.rotation.x = 0;
            this.isAttacking = false;
          }
        };
        thrust();
      },
      setDead(dead: boolean) {
        this.isDead = dead;
        if (dead) {
          charRoot.rotation.z = Math.PI / 2;
          charRoot.position.y = 0.3;
          pointLight.intensity = 0.1;
          glow.visible = false;
        } else {
          charRoot.rotation.z = 0;
          pointLight.intensity = 1.8;
          glow.visible = true;
        }
      },
    };

    return handle;
  }

  // 4. FRAUD MERCHANT
  private createMerchant(pos: THREE.Vector3): CharacterMeshHandle {
    const group = new THREE.Group();
    group.position.copy(pos);

    const { pedestal, glow } = this.createPedestal(0x064e3b, 0x34d399);
    group.add(pedestal);
    group.add(glow);

    const charRoot = new THREE.Group();
    charRoot.position.y = 0.4;
    group.add(charRoot);

    // Plump Tunic
    const tunicMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5 });
    const tunic = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), tunicMat);
    tunic.position.y = 0.9;
    tunic.scale.set(1.1, 1.2, 0.9);
    charRoot.add(tunic);

    // Gold Button Sash
    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.08, 8, 20), this.matGold);
    sash.rotation.x = Math.PI / 2;
    sash.position.y = 0.7;
    charRoot.add(sash);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), this.matSkin);
    head.position.y = 1.7;
    charRoot.add(head);

    // Turban with Peacock Feather
    const turbanGroup = new THREE.Group();
    turbanGroup.position.set(0, 1.95, 0);

    const turban = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.18, 12, 20), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    turban.rotation.x = Math.PI / 2;
    turbanGroup.add(turban);

    const feather = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.02), this.matEmerald);
    feather.position.set(0, 0.35, 0.35);
    feather.rotation.z = 0.3;
    turbanGroup.add(feather);
    charRoot.add(turbanGroup);

    // Huge Explorer Backpack with wares
    const backpackGroup = new THREE.Group();
    backpackGroup.position.set(0, 1.0, -0.55);

    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.5), new THREE.MeshStandardMaterial({ color: 0x92400e }));
    backpackGroup.add(pack);

    // Rolled carpet on top
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.1, 12), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
    roll.rotation.z = Math.PI / 2;
    roll.position.y = 0.6;
    backpackGroup.add(roll);

    // Dangling potions on pack
    const potion = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), this.matRuby);
    potion.position.set(0.4, -0.2, 0.2);
    backpackGroup.add(potion);
    charRoot.add(backpackGroup);

    // Hands flipping gold coins
    const coinGroup = new THREE.Group();
    coinGroup.position.set(0.5, 1.1, 0.4);

    const coin1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12), this.matGold);
    coin1.rotation.x = Math.PI / 2;
    const coin2 = coin1.clone();
    coin2.position.y = 0.2;
    coinGroup.add(coin1, coin2);
    charRoot.add(coinGroup);

    // Warm Emerald/Gold point light
    const pointLight = new THREE.PointLight(0x34d399, 1.3, 5);
    pointLight.position.set(0, 2.0, 1);
    group.add(pointLight);

    const handle: CharacterMeshHandle = {
      type: CharacterType.MERCHANT,
      group,
      bodyMesh: charRoot,
      weaponMesh: coinGroup,
      accessories: [turbanGroup, backpackGroup, coinGroup],
      pedestal,
      glowAura: glow,
      pointLight,
      homePosition: pos.clone(),
      targetPosition: pos.clone(),
      animTime: 0,
      isAttacking: false,
      isDead: false,
      update(delta: number) {
        if (this.isDead) return;
        this.animTime += delta;
        // Bobbing & flipping coins
        charRoot.position.y = 0.4 + Math.sin(this.animTime * 3.5) * 0.06;
        coinGroup.position.y = 1.1 + Math.abs(Math.sin(this.animTime * 5)) * 0.35;
        coinGroup.rotation.y = this.animTime * 6;
        backpackGroup.rotation.z = Math.sin(this.animTime * 3.5) * 0.05;
      },
      playAttackAnim(targetPos: THREE.Vector3) {
        this.isAttacking = true;
        // Sneaky heist rush
        let time = 0;
        const heist = () => {
          time += 0.06;
          coinGroup.scale.setScalar(1 + Math.sin(time * Math.PI) * 1.5);
          if (time < 1.0) {
            requestAnimationFrame(heist);
          } else {
            coinGroup.scale.setScalar(1);
            this.isAttacking = false;
          }
        };
        heist();
      },
      setDead(dead: boolean) {
        this.isDead = dead;
        if (dead) {
          charRoot.rotation.z = Math.PI / 2;
          charRoot.position.y = 0.3;
          pointLight.intensity = 0.1;
          glow.visible = false;
        } else {
          charRoot.rotation.z = 0;
          pointLight.intensity = 1.3;
          glow.visible = true;
        }
      },
    };

    return handle;
  }
}
