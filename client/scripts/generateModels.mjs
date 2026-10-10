// Node.js script to generate clean, optimized .glb 3D models for Catan items
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODELS_DIR = path.resolve(__dirname, '../public/models');

if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

// Polyfill FileReader for Node.js
globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = 'data:application/octet-stream;base64,' + Buffer.from(buf).toString('base64');
      if (this.onloadend) this.onloadend();
    });
  }
};

const exporter = new GLTFExporter();

function exportGLB(scene, filename) {
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (glb) => {
        const filePath = path.join(MODELS_DIR, filename);
        fs.writeFileSync(filePath, Buffer.from(glb));
        console.log(`Exported ${filename} (${glb.byteLength} bytes)`);
        resolve(filePath);
      },
      (err) => reject(err),
      { binary: true }
    );
  });
}

// Helper to normalize and merge multiple geometries cleanly
function normalizeGeo(g) {
  const nonIdx = g.index ? g.toNonIndexed() : g.clone();
  nonIdx.computeVertexNormals();
  const clean = new THREE.BufferGeometry();
  clean.setAttribute('position', nonIdx.getAttribute('position'));
  clean.setAttribute('normal', nonIdx.getAttribute('normal'));
  const pos = nonIdx.getAttribute('position');
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2] = pos.getX(i);
    uvs[i * 2 + 1] = pos.getZ(i);
  }
  clean.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return clean;
}

function mergeGeometries(geos) {
  const normalized = geos.map(normalizeGeo);
  const merged = BufferGeometryUtils.mergeGeometries(normalized, false);
  merged.computeVertexNormals();
  return merged;
}

// -------------------------------------------------------------
// 1. SETTLEMENT.GLB
// -------------------------------------------------------------
async function createSettlement() {
  const scene = new THREE.Scene();

  // House Body + Timber posts (Player colored)
  const wallGeo = new THREE.BoxGeometry(0.72, 0.48, 0.58);
  wallGeo.translate(0, 0.24, 0);

  // Doorway lintel
  const doorGeo = new THREE.BoxGeometry(0.2, 0.28, 0.04);
  doorGeo.translate(0, 0.14, 0.3);

  // Corner wood pillars
  const pillarGeo1 = new THREE.BoxGeometry(0.08, 0.5, 0.08);
  pillarGeo1.translate(-0.35, 0.25, -0.28);
  const pillarGeo2 = new THREE.BoxGeometry(0.08, 0.5, 0.08);
  pillarGeo2.translate(0.35, 0.25, -0.28);
  const pillarGeo3 = new THREE.BoxGeometry(0.08, 0.5, 0.08);
  pillarGeo3.translate(-0.35, 0.25, 0.28);
  const pillarGeo4 = new THREE.BoxGeometry(0.08, 0.5, 0.08);
  pillarGeo4.translate(0.35, 0.25, 0.28);

  const bodyCombined = mergeGeometries([wallGeo, doorGeo, pillarGeo1, pillarGeo2, pillarGeo3, pillarGeo4]);
  const bodyMat = new THREE.MeshStandardMaterial({
    name: 'SettlementBodyMat',
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.1,
  });
  const bodyMesh = new THREE.Mesh(bodyCombined, bodyMat);
  bodyMesh.name = 'SettlementBody';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  scene.add(bodyMesh);

  // Gabled Roof + Chimney (Warm Terracotta / Stone)
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-0.42, 0);
  roofShape.lineTo(0, 0.36);
  roofShape.lineTo(0.42, 0);
  roofShape.closePath();
  const roofExtrude = new THREE.ExtrudeGeometry(roofShape, {
    depth: 0.68,
    bevelEnabled: false,
  });
  roofExtrude.center();
  roofExtrude.translate(0, 0.62, 0);

  const chimneyGeo = new THREE.BoxGeometry(0.14, 0.4, 0.14);
  chimneyGeo.translate(0.24, 0.68, 0.12);
  const capGeo = new THREE.BoxGeometry(0.18, 0.05, 0.18);
  capGeo.translate(0.24, 0.88, 0.12);

  const roofCombined = mergeGeometries([roofExtrude, chimneyGeo, capGeo]);
  const roofMat = new THREE.MeshStandardMaterial({
    name: 'SettlementRoofMat',
    color: 0x993d28,
    roughness: 0.6,
    metalness: 0.05,
  });
  const roofMesh = new THREE.Mesh(roofCombined, roofMat);
  roofMesh.name = 'SettlementRoof';
  roofMesh.castShadow = true;
  scene.add(roofMesh);

  await exportGLB(scene, 'settlement.glb');
}

// -------------------------------------------------------------
// 2. CITY.GLB
// -------------------------------------------------------------
async function createCity() {
  const scene = new THREE.Scene();

  // Fortress Keep + Round Watchtower Base (Player colored)
  const keepGeo = new THREE.BoxGeometry(0.92, 0.65, 0.68);
  keepGeo.translate(0, 0.325, 0);

  const towerGeo = new THREE.CylinderGeometry(0.28, 0.32, 1.05, 8);
  towerGeo.translate(-0.28, 0.525, 0.14);

  const gateGeo = new THREE.BoxGeometry(0.22, 0.3, 0.06);
  gateGeo.translate(0.18, 0.15, 0.35);

  const bodyCombined = mergeGeometries([keepGeo, towerGeo, gateGeo]);
  const bodyMat = new THREE.MeshStandardMaterial({
    name: 'CityBodyMat',
    color: 0xffffff,
    roughness: 0.35,
    metalness: 0.15,
  });
  const bodyMesh = new THREE.Mesh(bodyCombined, bodyMat);
  bodyMesh.name = 'CityBody';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  scene.add(bodyMesh);

  // Tower Spire + Crenellations (Slate gray)
  const spireGeo = new THREE.ConeGeometry(0.36, 0.52, 8);
  spireGeo.translate(-0.28, 1.28, 0.14);

  // 6 crenellation blocks along keep parapet
  const cren1 = new THREE.BoxGeometry(0.14, 0.12, 0.12);
  cren1.translate(0.38, 0.71, 0.28);
  const cren2 = new THREE.BoxGeometry(0.14, 0.12, 0.12);
  cren2.translate(0.12, 0.71, 0.28);
  const cren3 = new THREE.BoxGeometry(0.14, 0.12, 0.12);
  cren3.translate(0.38, 0.71, -0.28);
  const cren4 = new THREE.BoxGeometry(0.14, 0.12, 0.12);
  cren4.translate(0.12, 0.71, -0.28);
  const cren5 = new THREE.BoxGeometry(0.12, 0.12, 0.14);
  cren5.translate(0.42, 0.71, 0);

  const roofCombined = mergeGeometries([spireGeo, cren1, cren2, cren3, cren4, cren5]);
  const roofMat = new THREE.MeshStandardMaterial({
    name: 'CityRoofMat',
    color: 0x334155,
    roughness: 0.65,
    metalness: 0.2,
  });
  const roofMesh = new THREE.Mesh(roofCombined, roofMat);
  roofMesh.name = 'CityRoof';
  roofMesh.castShadow = true;
  scene.add(roofMesh);

  await exportGLB(scene, 'city.glb');
}

// -------------------------------------------------------------
// 3. ROAD.GLB
// -------------------------------------------------------------
async function createRoad() {
  const scene = new THREE.Scene();

  // Road Timber Plank Body (Player colored)
  const deckGeo = new THREE.BoxGeometry(1.52, 0.14, 0.32);
  deckGeo.translate(0, 0.11, 0);

  const bodyMat = new THREE.MeshStandardMaterial({
    name: 'RoadBodyMat',
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.1,
  });
  const bodyMesh = new THREE.Mesh(deckGeo, bodyMat);
  bodyMesh.name = 'RoadBody';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  scene.add(bodyMesh);

  // Stone sleeper base + Iron endcap collars (Dark slate / iron)
  const sleeperGeo = new THREE.BoxGeometry(1.6, 0.05, 0.38);
  sleeperGeo.translate(0, 0.025, 0);

  const capGeo1 = new THREE.BoxGeometry(0.08, 0.17, 0.34);
  capGeo1.translate(-0.72, 0.11, 0);

  const capGeo2 = new THREE.BoxGeometry(0.08, 0.17, 0.34);
  capGeo2.translate(0.72, 0.11, 0);

  const accentsCombined = mergeGeometries([sleeperGeo, capGeo1, capGeo2]);
  const accentsMat = new THREE.MeshStandardMaterial({
    name: 'RoadAccentsMat',
    color: 0x334155,
    roughness: 0.7,
    metalness: 0.35,
  });
  const accentsMesh = new THREE.Mesh(accentsCombined, accentsMat);
  accentsMesh.name = 'RoadAccents';
  accentsMesh.castShadow = true;
  scene.add(accentsMesh);

  await exportGLB(scene, 'road.glb');
}

// -------------------------------------------------------------
// 4. ROBBER.GLB
// -------------------------------------------------------------
async function createRobber() {
  const scene = new THREE.Scene();

  // Carved wooden pedestal meeple base
  const baseGeo = new THREE.CylinderGeometry(0.36, 0.46, 0.24, 16);
  baseGeo.translate(0, 0.12, 0);
  const baseRimGeo = new THREE.TorusGeometry(0.42, 0.04, 8, 16);
  baseRimGeo.rotateX(Math.PI / 2);
  baseRimGeo.translate(0, 0.04, 0);
  const baseCombined = mergeGeometries([baseGeo, baseRimGeo]);
  const baseMat = new THREE.MeshStandardMaterial({
    name: 'RobberBaseMat',
    color: 0x18181b,
    roughness: 0.45,
    metalness: 0.1,
  });
  const baseMesh = new THREE.Mesh(baseCombined, baseMat);
  baseMesh.name = 'RobberBase';
  baseMesh.castShadow = true;
  scene.add(baseMesh);

  // Cloaked Torso + Hood
  const torsoGeo = new THREE.CylinderGeometry(0.22, 0.35, 0.65, 12);
  torsoGeo.translate(0, 0.56, 0);

  const cowlGeo = new THREE.CylinderGeometry(0.36, 0.24, 0.22, 12);
  cowlGeo.translate(0, 0.88, 0);

  const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
  headGeo.translate(0, 1.12, 0);

  const hoodOverhangGeo = new THREE.ConeGeometry(0.34, 0.32, 12);
  hoodOverhangGeo.translate(0, 1.16, 0.06);

  const cloakCombined = mergeGeometries([torsoGeo, cowlGeo, headGeo, hoodOverhangGeo]);
  const cloakMat = new THREE.MeshStandardMaterial({
    name: 'RobberCloakMat',
    color: 0x09090b,
    roughness: 0.6,
    metalness: 0.05,
  });
  const cloakMesh = new THREE.Mesh(cloakCombined, cloakMat);
  cloakMesh.name = 'RobberCloak';
  cloakMesh.castShadow = true;
  scene.add(cloakMesh);

  // Glowing Red Eyes
  const eye1 = new THREE.SphereGeometry(0.04, 8, 8);
  eye1.translate(0.07, 1.15, 0.22);
  const eye2 = new THREE.SphereGeometry(0.04, 8, 8);
  eye2.translate(-0.07, 1.15, 0.22);
  const eyesCombined = mergeGeometries([eye1, eye2]);
  const eyesMat = new THREE.MeshBasicMaterial({
    name: 'RobberEyesMat',
    color: 0xef4444,
  });
  const eyesMesh = new THREE.Mesh(eyesCombined, eyesMat);
  eyesMesh.name = 'RobberEyes';
  scene.add(eyesMesh);

  await exportGLB(scene, 'robber.glb');
}

// -------------------------------------------------------------
// 5. TREE.GLB
// -------------------------------------------------------------
async function createTree() {
  const scene = new THREE.Scene();

  const trunkGeo = new THREE.CylinderGeometry(0.07, 0.1, 0.45, 7);
  trunkGeo.translate(0, 0.225, 0);
  const trunkMat = new THREE.MeshStandardMaterial({
    name: 'TreeTrunkMat',
    color: 0x5c3d2e,
    roughness: 0.9,
  });
  const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
  trunkMesh.name = 'TreeTrunk';
  trunkMesh.castShadow = true;
  scene.add(trunkMesh);

  const tier1 = new THREE.ConeGeometry(0.44, 0.55, 7);
  tier1.translate(0, 0.55, 0);
  const tier2 = new THREE.ConeGeometry(0.35, 0.45, 7);
  tier2.translate(0, 0.85, 0);
  const tier3 = new THREE.ConeGeometry(0.25, 0.38, 7);
  tier3.translate(0, 1.15, 0);

  const foliageCombined = mergeGeometries([tier1, tier2, tier3]);
  const foliageMat = new THREE.MeshStandardMaterial({
    name: 'TreeFoliageMat',
    color: 0x15803d,
    roughness: 0.7,
    flatShading: true,
  });
  const foliageMesh = new THREE.Mesh(foliageCombined, foliageMat);
  foliageMesh.name = 'TreeFoliage';
  foliageMesh.castShadow = true;
  scene.add(foliageMesh);

  await exportGLB(scene, 'tree.glb');
}

// -------------------------------------------------------------
// 6. MOUNTAIN.GLB
// -------------------------------------------------------------
async function createMountain() {
  const scene = new THREE.Scene();

  const mainPeak = new THREE.ConeGeometry(0.85, 1.45, 6);
  mainPeak.translate(0, 0.725, 0);
  const subPeak = new THREE.ConeGeometry(0.55, 1.0, 5);
  subPeak.translate(0.45, 0.5, 0.26);

  const rockCombined = mergeGeometries([mainPeak, subPeak]);
  const rockMat = new THREE.MeshStandardMaterial({
    name: 'MountainRockMat',
    color: 0x475569,
    roughness: 0.85,
    flatShading: true,
  });
  const rockMesh = new THREE.Mesh(rockCombined, rockMat);
  rockMesh.name = 'MountainRock';
  rockMesh.castShadow = true;
  scene.add(rockMesh);

  const snow1 = new THREE.ConeGeometry(0.38, 0.55, 6);
  snow1.translate(0, 1.22, 0);
  const snow2 = new THREE.ConeGeometry(0.24, 0.4, 5);
  snow2.translate(0.45, 0.82, 0.26);

  const snowCombined = mergeGeometries([snow1, snow2]);
  const snowMat = new THREE.MeshStandardMaterial({
    name: 'MountainSnowMat',
    color: 0xf8fafc,
    roughness: 0.4,
    flatShading: true,
  });
  const snowMesh = new THREE.Mesh(snowCombined, snowMat);
  snowMesh.name = 'MountainSnow';
  scene.add(snowMesh);

  await exportGLB(scene, 'mountain.glb');
}

// -------------------------------------------------------------
// 7. WHEAT.GLB
// -------------------------------------------------------------
async function createWheat() {
  const scene = new THREE.Scene();

  const sheaf1 = new THREE.CylinderGeometry(0.12, 0.14, 0.55, 8);
  sheaf1.rotateZ(0.15);
  sheaf1.translate(-0.08, 0.27, 0);

  const sheaf2 = new THREE.CylinderGeometry(0.12, 0.14, 0.55, 8);
  sheaf2.rotateZ(-0.15);
  sheaf2.translate(0.08, 0.27, 0);

  const sheaf3 = new THREE.CylinderGeometry(0.11, 0.13, 0.58, 8);
  sheaf3.translate(0, 0.29, 0.05);

  const tieBand = new THREE.CylinderGeometry(0.26, 0.26, 0.08, 10);
  tieBand.translate(0, 0.26, 0.02);

  const wheatCombined = mergeGeometries([sheaf1, sheaf2, sheaf3, tieBand]);
  const wheatMat = new THREE.MeshStandardMaterial({
    name: 'WheatMat',
    color: 0xeab308,
    roughness: 0.85,
    flatShading: true,
  });
  const wheatMesh = new THREE.Mesh(wheatCombined, wheatMat);
  wheatMesh.name = 'WheatMesh';
  wheatMesh.castShadow = true;
  scene.add(wheatMesh);

  await exportGLB(scene, 'wheat.glb');
}

// -------------------------------------------------------------
// 8. SHEEP.GLB
// -------------------------------------------------------------
async function createSheep() {
  const scene = new THREE.Scene();

  const woolBody = new THREE.DodecahedronGeometry(0.25, 1);
  woolBody.scale(1.2, 0.9, 0.9);
  woolBody.translate(0, 0.25, 0);

  const woolMat = new THREE.MeshStandardMaterial({
    name: 'SheepWoolMat',
    color: 0xf8fafc,
    roughness: 0.9,
  });
  const woolMesh = new THREE.Mesh(woolBody, woolMat);
  woolMesh.name = 'SheepWool';
  woolMesh.castShadow = true;
  scene.add(woolMesh);

  const headGeo = new THREE.SphereGeometry(0.11, 8, 8);
  headGeo.translate(0.24, 0.3, 0);

  const leg1 = new THREE.CylinderGeometry(0.03, 0.03, 0.16, 6);
  leg1.translate(0.12, 0.08, 0.1);
  const leg2 = new THREE.CylinderGeometry(0.03, 0.03, 0.16, 6);
  leg2.translate(0.12, 0.08, -0.1);
  const leg3 = new THREE.CylinderGeometry(0.03, 0.03, 0.16, 6);
  leg3.translate(-0.12, 0.08, 0.1);
  const leg4 = new THREE.CylinderGeometry(0.03, 0.03, 0.16, 6);
  leg4.translate(-0.12, 0.08, -0.1);

  const darkCombined = mergeGeometries([headGeo, leg1, leg2, leg3, leg4]);
  const darkMat = new THREE.MeshStandardMaterial({
    name: 'SheepDarkMat',
    color: 0x1e293b,
    roughness: 0.8,
  });
  const darkMesh = new THREE.Mesh(darkCombined, darkMat);
  darkMesh.name = 'SheepDetails';
  scene.add(darkMesh);

  await exportGLB(scene, 'sheep.glb');
}

async function run() {
  console.log('Generating high quality Catan 3D GLB models...');
  await createSettlement();
  await createCity();
  await createRoad();
  await createRobber();
  await createTree();
  await createMountain();
  await createWheat();
  await createSheep();
  console.log('All GLB models successfully generated in client/public/models!');
}

run().catch((err) => {
  console.error('Error generating models:', err);
  process.exit(1);
});
