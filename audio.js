// audio.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";

// === Scene / Camera / Renderer ===
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000010, 20, 45);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000010);
document.getElementById("container").appendChild(renderer.domElement);

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// === Lighting ===
scene.add(new THREE.AmbientLight(0x99ccff, 0.7));
const pointLight = new THREE.PointLight(0x66ccff, 1.5, 100);
pointLight.position.set(0, 15, 10);
scene.add(pointLight);

// === Shader Skybox ===
const skyUniforms = {
  uTime: { value: 0 },
  uAudio: { value: 0 },
};

const skyShader = {
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vWorldPosition;
    uniform float uTime;
    uniform float uAudio;

    // hash noise
    float hash(vec3 p) {
      p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    void main() {
      vec3 dir = normalize(vWorldPosition);
      float t = uTime * 0.05;

      // subtle dark gradient
      vec3 baseColor = mix(vec3(0.0, 0.02, 0.04), vec3(0.0, 0.05, 0.08), dir.y * 0.5 + 0.5);

      // tech lines pattern
      float grid = abs(sin(dir.x * 60.0 + t * 40.0) * sin(dir.z * 60.0 - t * 30.0)) * 0.07;
      float stripes = abs(sin(dir.y * 120.0 + t * 60.0)) * 0.03;

      // random flicker
      float noise = hash(dir * 100.0 + t * 5.0) * 0.05;

      // audio pulse glow
      float pulse = 0.2 * pow(uAudio, 0.5);

      vec3 color = baseColor + vec3(grid + stripes + noise + pulse);
      color = clamp(color, 0.0, 1.0);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

const skyGeo = new THREE.BoxGeometry(200, 200, 200);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: skyUniforms,
  vertexShader: skyShader.vertexShader,
  fragmentShader: skyShader.fragmentShader,
});
const skyBox = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyBox);

// === Audio setup ===
const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load("./music/Pokemon.mp3", (buffer) => {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(0.8);
});

const analyser = new THREE.AudioAnalyser(sound, 256);

// === Outer circle bars (cyan-pink) ===
const bars = [];
const outerRadius = 6;
const outerCount = 256;

for (let i = 0; i < outerCount; i++) {
  const geometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff00cc,
    emissive: 0xff00cc,
    emissiveIntensity: 0.4,
    metalness: 0.9,
    roughness: 0.2,
  });
  const bar = new THREE.Mesh(geometry, material);
  const angle = (i / outerCount) * Math.PI * 2;
  bar.position.x = Math.cos(angle) * outerRadius;
  bar.position.z = Math.sin(angle) * outerRadius;
  bar.rotation.y = -angle;
  scene.add(bar);
  bars.push(bar);
}

// === Second outer ring (orange) ===
const bars2 = [];
const outerRadius2 = outerRadius + 1.2;
const rotationOffset = Math.PI / outerCount;
for (let i = 0; i < outerCount; i++) {
  const geometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff9900,
    emissive: 0xff5500,
    emissiveIntensity: 0.4,
    metalness: 0.8,
    roughness: 0.25,
  });
  const bar = new THREE.Mesh(geometry, material);
  const angle = (i / outerCount) * Math.PI * 2 + rotationOffset;
  bar.position.x = Math.cos(angle) * outerRadius2;
  bar.position.z = Math.sin(angle) * outerRadius2;
  bar.rotation.y = -angle;
  scene.add(bar);
  bars2.push(bar);
}

// === Third outer ring (white, furthest) ===
const bars3 = [];
const outerRadius3 = outerRadius2 + 1.2;
const rotationOffset2 = rotationOffset * 1.5;
for (let i = 0; i < outerCount; i++) {
  const geometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.35,
    metalness: 1.0,
    roughness: 0.15,
  });
  const bar = new THREE.Mesh(geometry, material);
  const angle = (i / outerCount) * Math.PI * 2 + rotationOffset2;
  bar.position.x = Math.cos(angle) * outerRadius3;
  bar.position.z = Math.sin(angle) * outerRadius3;
  bar.rotation.y = -angle;
  scene.add(bar);
  bars3.push(bar);
}

// === Inner circular "buildings" ===
const innerBuildings = [];
const radialCount = 128;
const layers = 14;
const maxRadius = outerRadius * 0.85;
const minRadius = 0.3;

for (let i = 0; i < radialCount; i++) {
  const angle = (i / radialCount) * Math.PI * 2;
  const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

  for (let j = 0; j < layers; j++) {
    const t = j / layers;
    const r = THREE.MathUtils.lerp(minRadius, maxRadius, t);
    const h = THREE.MathUtils.lerp(1.5, 0.1, t);
    const w = THREE.MathUtils.lerp(0.16, 0.05, t);

    const geometry = new THREE.BoxGeometry(w, h, w);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.4,
      metalness: 0.7,
      roughness: 0.3,
    });

    const box = new THREE.Mesh(geometry, material);
    box.position.copy(dir.clone().multiplyScalar(r));
    box.position.y = h / 2;
    box.rotation.y = -angle;
    scene.add(box);
    innerBuildings.push({ mesh: box, t, i });
  }
}

// === Camera ===
camera.position.set(0, 8, 15);
controls.update();

// === Postprocessing ===
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.35,
  0.8,
  0.1
);
composer.addPass(bloomPass);

const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  scene,
  camera
);
outlinePass.edgeStrength = 8.0;
outlinePass.edgeGlow = 1.2;
outlinePass.edgeThickness = 2.5;
outlinePass.visibleEdgeColor.set("#00ffff");
outlinePass.hiddenEdgeColor.set("#ff0088");
composer.addPass(outlinePass);

// === Play / Pause ===
document.body.addEventListener("click", () => {
  if (!sound.isPlaying) sound.play();
  else sound.pause();
});

// === Animate ===
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const data = analyser.getFrequencyData();

  // Update skybox uniforms
  const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
  skyUniforms.uTime.value = clock.getElapsedTime();
  skyUniforms.uAudio.value = avg;

  // Outer cyan/pink ring
  for (let i = 0; i < bars.length; i++) {
    const freq = data[i % data.length];
    const scale = (freq / 255) * 8 + 0.5;
    bars[i].scale.y = scale;
    bars[i].position.y = scale / 2;
    bars[i].material.emissiveIntensity = 0.3 + (freq / 255) * 0.7;
  }

  // Orange ring (offset)
  for (let i = 0; i < bars2.length; i++) {
    const freq = data[(i * 2) % data.length];
    const inverted = 1.0 - freq / 255;
    const scale = inverted * 8 + 0.5;
    bars2[i].scale.y = scale;
    bars2[i].position.y = scale / 2;
    bars2[i].material.emissiveIntensity = 0.3 + inverted * 0.7;
  }

  // White ring (smooth and slower)
  for (let i = 0; i < bars3.length; i++) {
    const freq = data[(i * 3) % data.length];
    const smooth = (Math.sin(Date.now() * 0.002 + i * 0.1) + 1) / 2;
    const scale = ((freq / 255) * 6 + 0.5) * (0.8 + 0.2 * smooth);
    bars3[i].scale.y = scale;
    bars3[i].position.y = scale / 2;
    bars3[i].material.emissiveIntensity = 0.3 + (freq / 255) * 0.5;
  }

  // Inner city
  for (let k = 0; k < innerBuildings.length; k++) {
    const { mesh, t, i } = innerBuildings[k];
    const index = Math.floor((i / radialCount) * data.length);
    const freq = data[index];
    const intensity = freq / 255;
    const baseHeight = THREE.MathUtils.lerp(1.5, 0.1, t);
    mesh.scale.y = baseHeight + intensity * (4.0 - t * 2.0);
    mesh.position.y = mesh.scale.y / 2;
    mesh.material.emissiveIntensity = 0.3 + intensity * 0.9;
  }

  outlinePass.edgeStrength = 6 + avg * 3;
  outlinePass.pulsePeriod = 2 + avg * 2;

  composer.render();
}

animate();

// === Resize ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});