import * as THREE from "three";

export class WorldMap3D {
  public group: THREE.Group;
  private animables: Array<(delta: number) => void> = [];

  constructor() {
    this.group = new THREE.Group();
    this.buildWorld();
  }

  private buildWorld() {
    this.buildFloatingIsland();
    this.buildCentralCrossroads();
    this.buildKingRealm();
    this.buildWitchRealm();
    this.buildDemonRealm();
    this.buildMerchantRealm();
    this.buildWaterAndBridges();
    this.buildSceneryProps();
  }

  // Floating Island Base with Cliff Rock Face
  private buildFloatingIsland() {
    // Upper grass/stone terrain (Hexagonal / Rounded polygon)
    const islandGeo = new THREE.CylinderGeometry(14, 11, 2.5, 32);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
      metalness: 0.1,
    });
    const islandBase = new THREE.Mesh(islandGeo, islandMat);
    islandBase.position.y = -1.25;
    islandBase.receiveShadow = true;
    this.group.add(islandBase);

    // Island Top Layer (Ground plane with slight bevel)
    const topGeo = new THREE.CylinderGeometry(14.2, 14, 0.4, 32);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
    });
    const islandTop = new THREE.Mesh(topGeo, topMat);
    islandTop.position.y = 0.1;
    islandTop.receiveShadow = true;
    this.group.add(islandTop);

    // Floating minor rocks around the island
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = 16 + Math.random() * 3;
      const rockGeo = new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.7, 0);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(Math.cos(angle) * dist, -1.5 + (Math.random() - 0.5) * 2, Math.sin(angle) * dist);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      this.group.add(rock);

      const floatSpeed = 1.0 + Math.random();
      const initialY = rock.position.y;
      this.animables.push((delta) => {
        rock.position.y = initialY + Math.sin(Date.now() * 0.0015 * floatSpeed) * 0.3;
        rock.rotation.y += delta * 0.2;
      });
    }
  }

  // Central Celestial Crossroads with God's Divine Obelisk
  private buildCentralCrossroads() {
    const plazaGeo = new THREE.CylinderGeometry(3.2, 3.4, 0.3, 24);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.4,
      metalness: 0.3,
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.y = 0.25;
    plaza.receiveShadow = true;
    this.group.add(plaza);

    // Golden Inlaid Ring
    const ringGeo = new THREE.TorusGeometry(2.4, 0.08, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.9,
      roughness: 0.2,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.41;
    this.group.add(ring);

    // God's Celestial Obelisk in center
    const obeliskGeo = new THREE.ConeGeometry(0.4, 2.8, 4);
    const obeliskMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      metalness: 0.8,
      roughness: 0.2,
    });
    const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
    obelisk.position.y = 1.8;
    obelisk.rotation.y = Math.PI / 4;
    this.group.add(obelisk);

    // Floating glowing holy gem above obelisk
    const gemGeo = new THREE.OctahedronGeometry(0.35, 0);
    const gemMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.y = 3.6;
    this.group.add(gem);

    const obeliskLight = new THREE.PointLight(0x38bdf8, 1.5, 6);
    obeliskLight.position.y = 3.6;
    this.group.add(obeliskLight);

    this.animables.push((delta) => {
      gem.rotation.y += delta * 1.5;
      gem.rotation.x += delta * 0.8;
      gem.position.y = 3.6 + Math.sin(Date.now() * 0.003) * 0.15;
    });
  }

  // 1. King's Realm: Sunlit Citadel (North-East: x: 5.5, z: -5.5)
  private buildKingRealm() {
    const realmGroup = new THREE.Group();
    realmGroup.position.set(5.5, 0, -5.5);

    // Green Meadow Terrain
    const groundGeo = new THREE.CylinderGeometry(5.2, 5.4, 0.4, 24);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = 0.25;
    ground.receiveShadow = true;
    realmGroup.add(ground);

    // Castle Keep
    const keepMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });

    // Main Keep Tower
    const towerGeo = new THREE.CylinderGeometry(1.2, 1.4, 3.2, 16);
    const keep = new THREE.Mesh(towerGeo, keepMat);
    keep.position.set(0, 1.8, -1.2);
    keep.castShadow = true;
    realmGroup.add(keep);

    // Conical Roof with Golden Spire
    const roofGeo = new THREE.ConeGeometry(1.5, 1.8, 16);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 4.3, -1.2);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.6, 8), goldMat);
    spire.position.set(0, 5.4, -1.2);
    realmGroup.add(roof, spire);

    // Flanking Wall Towers
    [-1.8, 1.8].forEach((xOffset) => {
      const subTower = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 2.4, 12), keepMat);
      subTower.position.set(xOffset, 1.4, -0.6);
      const subRoof = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.2, 12), roofMat);
      subRoof.position.set(xOffset, 3.2, -0.6);
      realmGroup.add(subTower, subRoof);

      // Connecting curtain wall
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 0.4), keepMat);
      wall.position.set(xOffset * 0.5, 1.0, -0.9);
      realmGroup.add(wall);
    });

    // Royal Guard Banners
    const bannerGeo = new THREE.BoxGeometry(0.4, 1.2, 0.04);
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
    const bannerL = new THREE.Mesh(bannerGeo, bannerMat);
    bannerL.position.set(-0.8, 1.8, -0.2);
    const bannerR = bannerL.clone();
    bannerR.position.x = 0.8;
    realmGroup.add(bannerL, bannerR);

    // Golden Wheat Fields
    const wheatMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.9 });
    for (let i = 0; i < 4; i++) {
      const wheatPatch = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.25, 0.8), wheatMat);
      wheatPatch.position.set(1.5 + (i % 2) * 1.1, 0.5, 1.2 + Math.floor(i / 2) * 0.9);
      realmGroup.add(wheatPatch);
    }

    this.group.add(realmGroup);
  }

  // 2. Witch's Realm: Enchanted Fen (North-West: x: -5.5, z: -5.5)
  private buildWitchRealm() {
    const realmGroup = new THREE.Group();
    realmGroup.position.set(-5.5, 0, -5.5);

    // Dark Swamp Moss Ground
    const groundGeo = new THREE.CylinderGeometry(5.2, 5.4, 0.4, 24);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = 0.25;
    ground.receiveShadow = true;
    realmGroup.add(ground);

    // Crooked Witch Hut
    const hutMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const hutRoofMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.6 });

    const hut = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 1.8), hutMat);
    hut.position.set(-0.6, 1.0, -1.0);
    hut.rotation.y = 0.2;
    hut.castShadow = true;
    realmGroup.add(hut);

    // Crooked thatched roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.6, 4), hutRoofMat);
    roof.position.set(-0.6, 2.4, -1.0);
    roof.rotation.y = Math.PI / 4 + 0.2;
    roof.rotation.z = -0.15;
    realmGroup.add(roof);

    // Chimney with violet smoke particles
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x78716c }));
    chimney.position.set(-1.1, 2.5, -0.6);
    realmGroup.add(chimney);

    // Bubbling Iron Cauldron
    const cauldronMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 });
    const cauldron = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 0.7, 16), cauldronMat);
    cauldron.position.set(1.4, 0.75, 0.8);
    realmGroup.add(cauldron);

    // Bubbling green potion liquid
    const brewMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
    const brew = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.05, 16), brewMat);
    brew.position.set(1.4, 1.05, 0.8);
    realmGroup.add(brew);

    const cauldronGlow = new THREE.PointLight(0x4ade80, 1.2, 4);
    cauldronGlow.position.set(1.4, 1.4, 0.8);
    realmGroup.add(cauldronGlow);

    // Giant Bioluminescent Mushrooms
    const shroomCapMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x7e22ce,
      roughness: 0.3,
    });
    const shroomStemMat = new THREE.MeshStandardMaterial({ color: 0xf3e8ff, roughness: 0.8 });

    [
      { x: -1.8, z: 1.2, s: 1.0 },
      { x: -2.3, z: 0.6, s: 0.6 },
      { x: 0.5, z: 1.8, s: 0.8 },
    ].forEach((s) => {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s.s, 0.15 * s.s, 0.8 * s.s, 8), shroomStemMat);
      stem.position.set(s.x, 0.4 + 0.4 * s.s, s.z);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.4 * s.s, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), shroomCapMat);
      cap.position.set(s.x, 0.8 + 0.4 * s.s, s.z);
      realmGroup.add(stem, cap);
    });

    this.animables.push((delta) => {
      brew.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.05);
      cauldronGlow.intensity = 1.0 + Math.sin(Date.now() * 0.008) * 0.4;
    });

    this.group.add(realmGroup);
  }

  // 3. Demon's Realm: Brimstone Abyss (South-West: x: -5.5, z: 5.5)
  private buildDemonRealm() {
    const realmGroup = new THREE.Group();
    realmGroup.position.set(-5.5, 0, 5.5);

    // Scorched Obsidian Ground
    const groundGeo = new THREE.CylinderGeometry(5.2, 5.4, 0.4, 24);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9, metalness: 0.2 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = 0.25;
    ground.receiveShadow = true;
    realmGroup.add(ground);

    // Molten Lava River crack
    const lavaMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    const lava = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.06, 0.8), lavaMat);
    lava.position.set(-0.5, 0.46, 0);
    lava.rotation.y = 0.4;
    realmGroup.add(lava);

    const lavaLight = new THREE.PointLight(0xf97316, 2.0, 6);
    lavaLight.position.set(-0.5, 1.2, 0);
    realmGroup.add(lavaLight);

    // Jagged Obsidian Spire Citadel
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.3, metalness: 0.6 });
    [-1.2, 0, 1.2].forEach((xOff, idx) => {
      const height = 2.0 + (idx === 1 ? 1.5 : 0.6);
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.6, height, 5), rockMat);
      spike.position.set(xOff - 0.5, 0.4 + height / 2, -1.4);
      spike.rotation.y = idx * 0.7;
      spike.rotation.z = (idx - 1) * 0.1;
      realmGroup.add(spike);
    });

    // Fiery Skull Braziers
    const brazierMat = new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.8 });
    [-1.8, 1.8].forEach((xOff) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.0, 8), brazierMat);
      stand.position.set(xOff, 0.9, 1.4);
      const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
      flame.position.set(xOff, 1.6, 1.4);
      realmGroup.add(stand, flame);

      this.animables.push(() => {
        flame.scale.y = 1 + Math.sin(Date.now() * 0.01 + xOff) * 0.3;
      });
    });

    this.animables.push(() => {
      lavaLight.intensity = 1.8 + Math.sin(Date.now() * 0.007) * 0.5;
    });

    this.group.add(realmGroup);
  }

  // 4. Merchant's Realm: Golden Bazaar (South-East: x: 5.5, z: 5.5)
  private buildMerchantRealm() {
    const realmGroup = new THREE.Group();
    realmGroup.position.set(5.5, 0, 5.5);

    // Warm Sandstone Ground
    const groundGeo = new THREE.CylinderGeometry(5.2, 5.4, 0.4, 24);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = 0.25;
    ground.receiveShadow = true;
    realmGroup.add(ground);

    // Striped Bazaar Tents
    const tentRoofMatA = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
    const tentRoofMatB = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5 });
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

    // Main Pavilion
    const mainTent = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.4, 6), tentRoofMatA);
    mainTent.position.set(0.8, 1.8, -1.2);
    realmGroup.add(mainTent);

    // Secondary Tent
    const subTent = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.1, 6), tentRoofMatB);
    subTent.position.set(-1.4, 1.5, -0.6);
    realmGroup.add(subTent);

    // Wooden Stalls, Crates, and Barrels
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
    [-0.5, 1.2].forEach((xOff, i) => {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), woodMat);
      crate.position.set(xOff, 0.7, 1.2);
      crate.rotation.y = i * 0.4;
      realmGroup.add(crate);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.8, 12), woodMat);
      barrel.position.set(xOff + 0.6, 0.8, 1.6);
      realmGroup.add(barrel);
    });

    // Piles of Gold Coins and Open Chest
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 });
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    chest.position.set(-1.0, 0.65, 1.2);
    realmGroup.add(chest);

    const chestGold = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.4), goldMat);
    chestGold.position.set(-1.0, 0.85, 1.2);
    realmGroup.add(chestGold);

    // Golden Lanterns
    const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), goldMat);
    lantern.position.set(0.8, 2.6, -1.2);
    realmGroup.add(lantern);

    const bazaarLight = new THREE.PointLight(0xfbbf24, 1.5, 5);
    bazaarLight.position.set(0, 1.8, 0.5);
    realmGroup.add(bazaarLight);

    this.group.add(realmGroup);
  }

  // Cobblestone roads connecting the central crossroads to all 4 realms
  private buildWaterAndBridges() {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });

    // 4 Connecting avenues
    const angles = [
      Math.PI / 4, // North-East (King)
      (3 * Math.PI) / 4, // North-West (Witch)
      (5 * Math.PI) / 4, // South-West (Demon)
      (7 * Math.PI) / 4, // South-East (Merchant)
    ];

    angles.forEach((ang) => {
      const roadGeo = new THREE.BoxGeometry(1.4, 0.12, 4.2);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.set(Math.sin(ang) * 4.0, 0.35, Math.cos(ang) * 4.0);
      road.rotation.y = ang;
      road.receiveShadow = true;
      this.group.add(road);

      // Lampposts along roads
      const lampMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.4, 8), lampMat);
      lamp.position.set(Math.sin(ang) * 3.2 + Math.cos(ang) * 0.9, 1.0, Math.cos(ang) * 3.2 - Math.sin(ang) * 0.9);
      const lightBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      lightBulb.position.set(0, 0.7, 0);
      lamp.add(lightBulb);
      this.group.add(lamp);
    });
  }

  // Scenery props: low-poly pine trees, rocks, shrubs
  private buildSceneryProps() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x582f0e });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

    const treePositions = [
      { x: 3.2, z: -3.0, s: 1.1 },
      { x: 7.2, z: -3.5, s: 0.9 },
      { x: 8.0, z: -7.0, s: 1.2 },
      { x: -3.5, z: -3.2, s: 0.9 },
      { x: -8.0, z: -7.0, s: 1.0 },
      { x: 7.5, z: 3.5, s: 0.8 },
      { x: 3.5, z: 7.5, s: 1.0 },
    ];

    treePositions.forEach((pos) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(pos.x, 0.4, pos.z);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * pos.s, 0.2 * pos.s, 0.8 * pos.s, 8), trunkMat);
      trunk.position.y = 0.4 * pos.s;
      treeGroup.add(trunk);

      // 3 Stacked Cones
      for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry((0.9 - i * 0.2) * pos.s, 0.8 * pos.s, 7),
          leafMat
        );
        cone.position.y = (0.7 + i * 0.45) * pos.s;
        cone.castShadow = true;
        treeGroup.add(cone);
      }

      this.group.add(treeGroup);
    });
  }

  public update(delta: number) {
    for (const anim of this.animables) {
      anim(delta);
    }
  }
}
