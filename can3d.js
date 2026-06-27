import * as THREE from "three";

const mount = document.getElementById("can-canvas");

// ---------- Renderer / Scene / Camera ----------
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0.15, 6.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
mount.appendChild(renderer.domElement);

// ---------- Lighting ----------
const ambient = new THREE.AmbientLight(0x223330, 1.1);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xfff2d6, 2.0);
keyLight.position.set(3, 4, 5);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x7dd8c4, 1.4);
rimLight.position.set(-4, 1, -3);
scene.add(rimLight);

const fillLight = new THREE.PointLight(0xc8ff4d, 0.6, 10);
fillLight.position.set(0, -2, 3);
scene.add(fillLight);

// ---------- Label texture (drawn procedurally so we don't depend on external assets) ----------
function buildLabelTexture() {
  const w = 1024, h = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // base bottle-green
  ctx.fillStyle = "#0B1A17";
  ctx.fillRect(0, 0, w, h);

  // soft vertical gradient sheen
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, "rgba(125,216,196,0.05)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.07)");
  grad.addColorStop(1, "rgba(125,216,196,0.05)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // lime band
  ctx.fillStyle = "#C8FF4D";
  ctx.fillRect(0, h * 0.42, w, h * 0.05);

  // wordmark "FIZZ"
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#F2E9D8";
  ctx.font = "800 150px 'Archivo Expanded', sans-serif";
  ctx.fillText("FIZZ", w / 2, h * 0.30);

  // wordmark "COLA"
  ctx.fillStyle = "#0B1A17";
  ctx.font = "700 70px 'Archivo Expanded', sans-serif";
  ctx.fillText("C O L A", w / 2, h * 0.445);

  // tagline
  ctx.fillStyle = "rgba(242,233,216,0.7)";
  ctx.font = "500 26px Inter, sans-serif";
  ctx.fillText("REFRESH THE MOMENT", w / 2, h * 0.58);

  // bubble motif
  const bubblePositions = [
    [0.3, 0.72, 10], [0.42, 0.78, 6], [0.55, 0.7, 8],
    [0.65, 0.8, 5], [0.36, 0.85, 4], [0.58, 0.88, 7],
    [0.48, 0.65, 5], [0.7, 0.68, 4]
  ];
  ctx.strokeStyle = "rgba(125,216,196,0.55)";
  ctx.lineWidth = 2.5;
  bubblePositions.forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x * w, y * h, r * 2.2, 0, Math.PI * 2);
    ctx.stroke();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

const labelTexture = buildLabelTexture();

// ---------- Can geometry ----------
const canGroup = new THREE.Group();

const bodyGeo = new THREE.CylinderGeometry(1, 1, 2.6, 64, 1, false);
const bodyMat = new THREE.MeshPhysicalMaterial({
  map: labelTexture,
  metalness: 0.55,
  roughness: 0.28,
  clearcoat: 0.6,
  clearcoatRoughness: 0.25,
  envMapIntensity: 1.2,
});
const body = new THREE.Mesh(bodyGeo, bodyMat);
canGroup.add(body);

const capMat = new THREE.MeshPhysicalMaterial({
  color: 0xb9c4bd,
  metalness: 0.9,
  roughness: 0.2,
  clearcoat: 0.7,
});

const topGeo = new THREE.CylinderGeometry(0.97, 1, 0.12, 64);
const top = new THREE.Mesh(topGeo, capMat);
top.position.y = 1.36;
canGroup.add(top);

const bottomGeo = new THREE.CylinderGeometry(1, 0.95, 0.1, 64);
const bottom = new THREE.Mesh(bottomGeo, capMat);
bottom.position.y = -1.35;
canGroup.add(bottom);

// subtle condensation droplets as small emissive-ish spheres on the surface
const dropletGeo = new THREE.SphereGeometry(0.022, 8, 8);
const dropletMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.55,
  roughness: 0.05,
  metalness: 0,
  clearcoat: 1,
});
for (let i = 0; i < 40; i++) {
  const droplet = new THREE.Mesh(dropletGeo, dropletMat);
  const angle = Math.random() * Math.PI * 2;
  const yPos = Math.random() * 2.2 - 1.1;
  const radius = 1.01;
  droplet.position.set(
    Math.cos(angle) * radius,
    yPos,
    Math.sin(angle) * radius
  );
  droplet.scale.setScalar(0.5 + Math.random() * 1.4);
  canGroup.add(droplet);
}

canGroup.rotation.z = 0.06;
scene.add(canGroup);

// ---------- Resize ----------
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);

  // scale can down a touch on small screens
  const scale = w < 640 ? 0.8 : 1;
  canGroup.scale.setScalar(scale);
}
window.addEventListener("resize", onResize);
onResize();

// ---------- Scroll interaction ----------
let scrollT = 0;
window.addEventListener("scroll", () => {
  const max = window.innerHeight;
  scrollT = Math.min(window.scrollY / max, 1);
}, { passive: true });

// ---------- Pointer parallax ----------
let pointerX = 0, pointerY = 0;
window.addEventListener("pointermove", (e) => {
  pointerX = (e.clientX / window.innerWidth) * 2 - 1;
  pointerY = (e.clientY / window.innerHeight) * 2 - 1;
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Animate ----------
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  if (!prefersReducedMotion) {
    canGroup.rotation.y = t * 0.25 + scrollT * Math.PI * 0.6;
    canGroup.rotation.x = pointerY * 0.12 + scrollT * 0.3;
    canGroup.position.y = Math.sin(t * 0.6) * 0.06 - scrollT * 1.4;
    canGroup.position.x = pointerX * 0.15;
  } else {
    canGroup.rotation.y = scrollT * Math.PI * 0.6;
  }

  // fade out as user scrolls past hero
  const opacity = Math.max(1 - scrollT * 1.3, 0);
  renderer.domElement.style.opacity = opacity.toString();

  renderer.render(scene, camera);
}
animate();
