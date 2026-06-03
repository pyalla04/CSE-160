/**
 * CSE 160 | Pooja Yalla | Assignment 5
 *
 * This scene was loosely inspired by the balloon house sequence
 * from the movie 'Up', where the house is lifted into the sky by
 * thousands of colorful balloons! The house floats above a forest of
 * trees and wooden crates with flower pots on top.
 *
 * Wow Features:
 * 1. Balloon Popping - click any balloon to pop it
 * 2. Helicopter Mode - double-click the house to trigger a helicopter animation
 * 3. Add Balloons - click the "+ Add Balloons" button to spawn 50 more balloons
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(-8, 35, 55);

// --- manual camera controls ---
const keys = {};
let yaw = 0;
let pitch = -0.15;
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup',   (e) => keys[e.key.toLowerCase()] = false);

renderer.domElement.addEventListener('mousedown', (e) => {
  isMouseDown = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});
renderer.domElement.addEventListener('mouseup', () => isMouseDown = false);
renderer.domElement.addEventListener('mousemove', (e) => {
  if (!isMouseDown) return;
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  yaw   -= dx * 0.003;
  pitch -= dy * 0.003;
  pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

// hook up HTML buttons after DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('reset-btn').addEventListener('click', () => {
    camera.position.set(-8, 35, 55);
    yaw = 0;
    pitch = -0.15;
  });

  document.getElementById('add-balloons-btn').addEventListener('click', () => {
    for (let i = 0; i < 50; i++) spawnBalloon();
  });
});

// skybox — 6 images for each face of a cube (tutorial 6)
const cubeLoader = new THREE.CubeTextureLoader();
scene.background = cubeLoader.load([
  'textures/px.jpg', 'textures/nx.jpg',
  'textures/py.jpg', 'textures/ny.jpg',
  'textures/pz.jpg', 'textures/nz.jpg',
]);

const texLoader = new THREE.TextureLoader();

// grass texture tiled across the ground plane
const grassTexture = texLoader.load('textures/grass.jpg');
grassTexture.colorSpace = THREE.SRGBColorSpace;
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(40, 40);

const GROUND_Y = -20;
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000),
  new THREE.MeshLambertMaterial({ map: grassTexture })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = GROUND_Y;
scene.add(ground);

// collect tree and crate positions for instanced rendering
const treePositions = [];
const cratePositions = [];

for (let x = -240; x <= 240; x += 5) {
  for (let z = -240; z <= 240; z += 5) {
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter < 15) continue;
    const scale = 0.5 + Math.random() * 1.5;
    if (Math.random() < 0.7) {
      treePositions.push({ x, z, scale });
    } else {
      cratePositions.push({ x, z });
    }
  }
}

const dummy = new THREE.Object3D();

// instanced trunks — one draw call for all trunks
const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 1, 6);
const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B5e3c });
const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length);
treePositions.forEach(({ x, z, scale }, i) => {
  const trunkHeight = 4 * scale;
  dummy.position.set(x, GROUND_Y + (trunkHeight / 2), z);
  dummy.scale.set(scale, trunkHeight, scale);
  dummy.updateMatrix();
  trunkMesh.setMatrixAt(i, dummy.matrix);
});
trunkMesh.instanceMatrix.needsUpdate = true;
scene.add(trunkMesh);

// instanced leaves — one draw call for all tree tops
const leavesGeo = new THREE.ConeGeometry(2, 1, 7);
const leavesMat = new THREE.MeshLambertMaterial({ color: 0x2d7a2d });
const leavesMesh = new THREE.InstancedMesh(leavesGeo, leavesMat, treePositions.length);
treePositions.forEach(({ x, z, scale }, i) => {
  const trunkHeight = 4 * scale;
  const leavesHeight = 4 * scale;
  dummy.position.set(x, GROUND_Y + trunkHeight + (leavesHeight / 2), z);
  dummy.scale.set(scale, leavesHeight, scale);
  dummy.updateMatrix();
  leavesMesh.setMatrixAt(i, dummy.matrix);
});
leavesMesh.instanceMatrix.needsUpdate = true;
scene.add(leavesMesh);

// instanced crates — textured wood boxes on the ground (tutorial 2)
const crateTexture = texLoader.load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
crateTexture.colorSpace = THREE.SRGBColorSpace;
const crateGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
const crateMat = new THREE.MeshLambertMaterial({ map: crateTexture });
const crateMesh = new THREE.InstancedMesh(crateGeo, crateMat, cratePositions.length);
cratePositions.forEach(({ x, z }, i) => {
  dummy.position.set(x, GROUND_Y + 0.6, z);
  dummy.scale.set(1, 1, 1);
  dummy.rotation.set(0, 0, 0);
  dummy.updateMatrix();
  crateMesh.setMatrixAt(i, dummy.matrix);
});
crateMesh.instanceMatrix.needsUpdate = true;
scene.add(crateMesh);

// instanced pots — terracotta cylinders sitting on top of crates
const potGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.5, 8);
const potMat = new THREE.MeshLambertMaterial({ color: 0xc1440e });
const potMesh = new THREE.InstancedMesh(potGeo, potMat, cratePositions.length);
cratePositions.forEach(({ x, z }, i) => {
  dummy.position.set(x, GROUND_Y + 1.2 + 0.25, z);
  dummy.scale.set(1, 1, 1);
  dummy.rotation.set(0, 0, 0);
  dummy.updateMatrix();
  potMesh.setMatrixAt(i, dummy.matrix);
});
potMesh.instanceMatrix.needsUpdate = true;
scene.add(potMesh);

// instanced plants — small green spheres on top of pots
const plantGeo = new THREE.SphereGeometry(0.22, 6, 6);
const plantMat = new THREE.MeshLambertMaterial({ color: 0x33aa33 });
const plantMesh = new THREE.InstancedMesh(plantGeo, plantMat, cratePositions.length);
cratePositions.forEach(({ x, z }, i) => {
  dummy.position.set(x, GROUND_Y + 1.2 + 0.5 + 0.22, z);
  dummy.scale.set(1, 1, 1);
  dummy.rotation.set(0, 0, 0);
  dummy.updateMatrix();
  plantMesh.setMatrixAt(i, dummy.matrix);
});
plantMesh.instanceMatrix.needsUpdate = true;
scene.add(plantMesh);

// 3 different light sources (tutorial 5)
// 1. AmbientLight — fills the scene with soft overall light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// 2. DirectionalLight — acts like the sun, casts parallel rays
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// 3. PointLight — warm glow bouncing off the house
const pointLight = new THREE.PointLight(0xff8800, 1, 50);
pointLight.position.set(-5, 5, -5);
scene.add(pointLight);

// masterGroup handles the overall bobbing and base position
const masterGroup = new THREE.Group();
masterGroup.position.set(-8, 38, 0);
masterGroup.rotation.z = 0.15;
scene.add(masterGroup);

// houseGroup contains everything — house + balloons + strings
const houseGroup = new THREE.Group();
masterGroup.add(houseGroup);

// load the house glb model (tutorial 3)
const loader = new GLTFLoader();
let houseMesh = null;
loader.load(
  'models/house.glb',
  function(gltf) {
    houseMesh = gltf.scene;
    houseMesh.scale.set(5, 5, 5);
    houseGroup.add(houseMesh);
  },
  undefined,
  (error) => console.error('House load error:', error)
);

// balloon colors
const balloonColors = [
  0xff3333, 0xff6600, 0xffcc00, 0x33cc33,
  0x3399ff, 0x9933ff, 0xff66cc, 0x00cccc,
  0xff9900, 0x66ff33, 0xff0066, 0x00ff99,
];

const balloonMeshes = [];

// helper to spawn a single balloon into houseGroup
function spawnBalloon() {
  const color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
  const balloon = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 8, 8),
    new THREE.MeshPhongMaterial({ color, shininess: 80 })
  );
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 8;
  const height = 12 + Math.random() * 10;
  balloon.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
  houseGroup.add(balloon);
  balloonMeshes.push(balloon);

  const stringPoints = [
    new THREE.Vector3(balloon.position.x, balloon.position.y - 0.6, balloon.position.z),
    new THREE.Vector3(balloon.position.x * 0.2, 6, balloon.position.z * 0.2),
  ];
  houseGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(stringPoints),
    new THREE.LineBasicMaterial({ color: 0xaaaaaa })
  ));
}

// spawn initial 500 balloons
for (let i = 0; i < 500; i++) spawnBalloon();

// raycaster for detecting mouse clicks on balloons and house
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const popping = new Map();

// helicopter animation state
let heliPhase = 'idle';
let heliProgress = 0;
const BASE_Y = 38;
const HIGH_Y = 65;

// click — pop a balloon
renderer.domElement.addEventListener('click', (e) => {
  pointer.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(balloonMeshes);
  if (hits.length > 0) {
    const hit = hits[0].object;
    if (!popping.has(hit)) popping.set(hit, 1.0);
  }
});

// double click — trigger helicopter animation
renderer.domElement.addEventListener('dblclick', (e) => {
  if (heliPhase !== 'idle') return;
  pointer.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  if (houseMesh) {
    const hits = raycaster.intersectObjects(houseMesh.children, true);
    if (hits.length > 0) {
      heliPhase = 'rising';
      heliProgress = 0;
    }
  }
});

const clock = new THREE.Clock();
const moveSpeed = 15;

function animate() {
  const delta = clock.getDelta();
  const time = clock.elapsedTime;

  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  camera.getWorldDirection(forward);
  right.crossVectors(forward, camera.up).normalize();

  if (keys['w']) camera.position.addScaledVector(forward, moveSpeed * delta);
  if (keys['s']) camera.position.addScaledVector(forward, -moveSpeed * delta);
  if (keys['a']) camera.position.addScaledVector(right, -moveSpeed * delta);
  if (keys['d']) camera.position.addScaledVector(right, moveSpeed * delta);
  if (keys['e']) camera.position.y += moveSpeed * delta;
  if (keys['q']) camera.position.y -= moveSpeed * delta;

  // helicopter animation phases
  if (heliPhase === 'idle') {
    masterGroup.position.y = BASE_Y + Math.sin(time * 0.5) * 0.5;
    masterGroup.rotation.z = 0.15 + Math.sin(time * 0.3) * 0.02;
    houseGroup.rotation.y = 0;

  } else if (heliPhase === 'rising') {
    heliProgress += delta / 1.5;
    const t = Math.min(heliProgress, 1);
    masterGroup.position.y = BASE_Y + (HIGH_Y - BASE_Y) * t;
    houseGroup.rotation.y += delta * (t * 8);
    if (heliProgress >= 1) { heliPhase = 'spinning'; heliProgress = 0; }

  } else if (heliPhase === 'spinning') {
    heliProgress += delta / 1.5;
    masterGroup.position.y = HIGH_Y;
    houseGroup.rotation.y += delta * 10;
    if (heliProgress >= 1) { heliPhase = 'descending'; heliProgress = 0; }

  } else if (heliPhase === 'descending') {
    heliProgress += delta / 1.5;
    const t = Math.min(heliProgress, 1);
    masterGroup.position.y = HIGH_Y - (HIGH_Y - BASE_Y) * t;
    houseGroup.rotation.y += delta * (10 * (1 - t));
    if (heliProgress >= 1) {
      heliPhase = 'idle';
      heliProgress = 0;
      houseGroup.rotation.y = 0;
    }
  }

  // pop animation — balloon shrinks then disappears
  popping.forEach((scale, balloon) => {
    scale -= 0.08;
    if (scale <= 0) {
      balloon.visible = false;
      popping.delete(balloon);
    } else {
      balloon.scale.setScalar(scale);
      popping.set(balloon, scale);
    }
  });

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});