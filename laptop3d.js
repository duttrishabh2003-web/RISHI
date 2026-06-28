import * as THREE from "three";

const mount = document.getElementById("laptop-canvas");

const colorways = [
  { name: "Midnight Black", hex: 0x1c1d22 },
  { name: "Lunar Silver", hex: 0xc7cbd1 },
  { name: "Solar Gold", hex: 0xd8b876 },
  { name: "Astral Blue", hex: 0x3c5278 },
];

let currentColorIndex = 0;

// ---------- Scene setup ----------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, mount.clientWidth / mount.clientHeight, 0.1, 100);
camera.position.set(0, 1.1, 5.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(mount.clientWidth, mount.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
mount.appendChild(renderer.domElement);

// ---------- Lighting ----------
scene.add(new THREE.AmbientLight(0x2a2d3a, 1.2));

const key = new THREE.DirectionalLight(0xffffff, 2.0);
key.position.set(3, 5, 4);
scene.add(key);

const rim = new THREE.DirectionalLight(0x7c9cff, 1.6);
rim.position.set(-4, 1, -3);
scene.add(rim);

const fill = new THREE.PointLight(0xe8c181, 0.5, 12);
fill.position.set(0, -1, 3);
scene.add(fill);

// ---------- Laptop group ----------
const laptop = new THREE.Group();

const bodyMat = new THREE.MeshPhysicalMaterial({
  color: colorways[0].hex,
  metalness: 0.7,
  roughness: 0.35,
  clearcoat: 0.4,
  clearcoatRoughness: 0.3,
});

const hingeMat = new THREE.MeshPhysicalMaterial({
  color: 0x111216,
  metalness: 0.5,
  roughness: 0.5,
});

const screenMat = new THREE.MeshPhysicalMaterial({
  color: 0x05060a,
  metalness: 0.1,
  roughness: 0.15,
  emissive: 0x0a1530,
  emissiveIntensity: 0.4,
});

// Base
const baseGeo = new THREE.BoxGeometry(2.6, 0.09, 1.7, 4, 1, 4);
const base = new THREE.Mesh(baseGeo, bodyMat);
laptop.add(base);

// Keyboard deck detail (subtle inset)
const deckGeo = new THREE.BoxGeometry(2.3, 0.01, 1.4);
const deckMat = new THREE.MeshPhysicalMaterial({ color: 0x14151a, metalness: 0.6, roughness: 0.5 });
const deck = new THREE.Mesh(deckGeo, deckMat);
deck.position.set(0, 0.05, -0.05);
laptop.add(deck);

// Lid group (pivots around back hinge edge)
const lidPivot = new THREE.Group();
lidPivot.position.set(0, 0.045, -0.85);
laptop.add(lidPivot);

const lidGeo = new THREE.BoxGeometry(2.6, 0.07, 1.7, 4, 1, 4);
const lid = new THREE.Mesh(lidGeo, bodyMat);
lid.position.set(0, 0.85, -0.85);
lidPivot.add(lid);

// Screen (front face of the lid)
const screenGeo = new THREE.PlaneGeometry(2.35, 1.5);
const screen = new THREE.Mesh(screenGeo, screenMat);
screen.position.set(0, 0.85, -0.815);
screen.rotation.x = 0;
lidPivot.add(screen);

// Aurelia mark on lid back
const markCanvas = document.createElement("canvas");
markCanvas.width = 256;
markCanvas.height = 256;
const mctx = markCanvas.getContext("2d");
mctx.clearRect(0, 0, 256, 256);
mctx.strokeStyle = "rgba(255,255,255,0.8)";
mctx.lineWidth = 10;
mctx.lineJoin = "round";
mctx.beginPath();
mctx.moveTo(128, 70);
mctx.lineTo(70, 190);
mctx.moveTo(128, 70);
mctx.lineTo(186, 190);
mctx.moveTo(98, 150);
mctx.lineTo(158, 150);
mctx.stroke();
const markTex = new THREE.CanvasTexture(markCanvas);
markTex.colorSpace = THREE.SRGBColorSpace;

const markGeo = new THREE.PlaneGeometry(0.3, 0.3);
const markMat = new THREE.MeshBasicMaterial({ map: markTex, transparent: true });
const mark = new THREE.Mesh(markGeo, markMat);
mark.position.set(0, 1.0, -1.685);
mark.rotation.y = Math.PI;
lidPivot.add(mark);

lidPivot.rotation.x = -1.15; // open angle

scene.add(laptop);
laptop.rotation.x = -0.15;
laptop.position.y = -0.3;

// ---------- Color switching ----------
function setColor(index) {
  currentColorIndex = index;
  const target = new THREE.Color(colorways[index].hex);
  bodyMat.color.copy(target);
}

window.__setLaptopColor = setColor;

// ---------- Resize ----------
function onResize() {
  const w = mount.clientWidth;
  const h = mount.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener("resize", onResize);

// ---------- Drag-to-rotate interaction ----------
let isDragging = false;
let prevX = 0, prevY = 0;
let rotationY = 0.4;
let rotationX = -0.15;
let velocityY = 0;

function pointerDown(e) {
  isDragging = true;
  prevX = e.clientX ?? e.touches?.[0]?.clientX;
  prevY = e.clientY ?? e.touches?.[0]?.clientY;
}
function pointerMove(e) {
  if (!isDragging) return;
  const clientX = e.clientX ?? e.touches?.[0]?.clientX;
  const clientY = e.clientY ?? e.touches?.[0]?.clientY;
  const dx = clientX - prevX;
  const dy = clientY - prevY;
  velocityY = dx * 0.005;
  rotationY += dx * 0.005;
  rotationX = Math.max(Math.min(rotationX - dy * 0.003, 0.4), -0.6);
  prevX = clientX;
  prevY = clientY;
}
function pointerUp() {
  isDragging = false;
}

mount.addEventListener("pointerdown", pointerDown);
window.addEventListener("pointermove", pointerMove);
window.addEventListener("pointerup", pointerUp);
mount.addEventListener("touchstart", pointerDown, { passive: true });
window.addEventListener("touchmove", pointerMove, { passive: true });
window.addEventListener("touchend", pointerUp);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Animate ----------
function animate() {
  requestAnimationFrame(animate);

  if (!isDragging && !prefersReducedMotion) {
    rotationY += 0.0025 + velocityY * 0.02;
    velocityY *= 0.92;
  }

  laptop.rotation.y = rotationY;
  laptop.rotation.x = rotationX;

  renderer.render(scene, camera);
}

// run an initial size pass once mounted in layout
requestAnimationFrame(() => {
  onResize();
  animate();
});

export { colorways, setColor };
