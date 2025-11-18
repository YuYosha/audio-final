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

// === Audio setup ===
const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
const analyser = new THREE.AudioAnalyser(sound, 256);

const tracks = [
  { label: "Nikke", file: "Nikke.mp3" },
  { label: "Bingo", file: "Bingo.mp3" },
  { label: "Black", file: "Black.mp3" },
  { label: "Casino", file: "Casino.mp3" },
  { label: "Duel", file: "Duel.mp3" },
  { label: "EggD", file: "EggD.mp3" },
  { label: "EggS", file: "EggS.mp3" },
  { label: "Emote", file: "Emote.mp3" },
  { label: "Expo", file: "Expo.mp3" },
  { label: "Forever", file: "Forever.mp3" },
  { label: "Fury", file: "Fury.mp3" },
  { label: "Megalo", file: "megalo.mp3" },
  { label: "Metal", file: "Metal.mp3" },
  { label: "PM", file: "PM.mp3" },
  { label: "Pokemon", file: "Pokemon.mp3" },
  { label: "Riders", file: "Riders.mp3" },
  { label: "Rude", file: "Rude.mp3" },
  { label: "Sans", file: "Sans.mp3" },
  { label: "SonicR", file: "SonicR.mp3" },
  { label: "Tea", file: "Tea.mp3" },
  { label: "Tou", file: "Tou.mp3" },
  { label: "Way", file: "Way.mp3" },
  { label: "LoveF", file: "LoveF.mp3" },
];

let currentTrackIndex = 0; // default to "Nikke"
let isTrackLoading = false;
let pendingAutoplay = false;
let activeLoadToken = 0;

const trackNameEl = document.getElementById("track-name");
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const nextBtn = document.getElementById("next-btn");
const prevBtn = document.getElementById("prev-btn");
const videoOverlayEl = document.getElementById("video-overlay");
const overlayVideoEl = document.getElementById("overlay-video");

const overlayVideos = [
  "asgore.mp4",
 // "benson.mp4",
  //"dante.mp4",
  "eggman.mp4",
  "eggsax.mp4",
 // "goku.mp4",
  //"jojo.mp4",
  "metal.mp4",
  //"metroman.mp4",
  "mez.mp4",
  "p3.mp4",
  //"pbj.mp4",
  "ratdance.mp4",
  "rewrite.mp4",
  //"springtrap.mp4",
  "teto.mp4",
  //"tf2.mp4",
  "cream.mp4",
  "DC.mp4", 
];
const VIDEO_CHECK_INTERVAL = 12000;
const VIDEO_APPEAR_CHANCE = 0.38; // ~38% chance per interval -> more common
let videoIntervalId = null;
let overlayIsActive = false;
let glitchTimeoutId = null;

function updateTrackLabel(state = "ready") {
  if (!trackNameEl) return;
  const track = tracks[currentTrackIndex];
  const prefix = `${currentTrackIndex + 1}/${tracks.length} — `;
  if (state === "loading") {
    trackNameEl.textContent = `${prefix}Loading ${track.label}...`;
    return;
  }
  if (state === "error") {
    trackNameEl.textContent = `${prefix}Error loading ${track.label}`;
    return;
  }
  trackNameEl.textContent = `${prefix}${track.label}`;
}

async function resumeAudioContext() {
  const audioContext = THREE.AudioContext.getContext();
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
}

function loadTrack(index, shouldAutoplay = false) {
  const normalizedIndex = (index + tracks.length) % tracks.length;
  currentTrackIndex = normalizedIndex;
  const track = tracks[currentTrackIndex];
  const loadToken = ++activeLoadToken;

  isTrackLoading = true;
  pendingAutoplay = shouldAutoplay;
  sound.stop();
  sound.buffer = null;
  updateTrackLabel("loading");
  
  // Apply color palette based on track index
  applyColorPalette(currentTrackIndex);

  audioLoader.load(
    `./music/${track.file}`,
    (buffer) => {
      if (loadToken !== activeLoadToken) return;
      isTrackLoading = false;
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(0.8);
      updateTrackLabel();
      const shouldPlayNow = pendingAutoplay;
      pendingAutoplay = false;
      if (shouldPlayNow) {
        playSound();
      }
    },
    undefined,
    (error) => {
      if (loadToken !== activeLoadToken) return;
      isTrackLoading = false;
      pendingAutoplay = false;
      updateTrackLabel("error");
      console.error(`Failed to load ${track.file}`, error);
    }
  );
}

async function playSound() {
  await resumeAudioContext();
  if (isTrackLoading) {
    pendingAutoplay = true;
    return;
  }
  if (!sound.buffer) {
    loadTrack(currentTrackIndex, true);
    return;
  }
  if (!sound.isPlaying) {
    sound.play();
  }
}

function stopSound() {
  pendingAutoplay = false;
  if (sound.isPlaying) {
    sound.stop();
  }
  // Stop any active video overlay when music stops
  if (overlayIsActive && overlayVideoEl) {
    overlayVideoEl.pause();
    overlayVideoEl.removeAttribute("src");
    overlayVideoEl.load();
    if (videoOverlayEl) {
      videoOverlayEl.classList.remove("visible");
      if (glitchTimeoutId) {
        window.clearTimeout(glitchTimeoutId);
        glitchTimeoutId = null;
      }
      videoOverlayEl.classList.remove("glitching");
    }
    overlayIsActive = false;
  }
}

function changeTrack(step) {
  const shouldAutoplay = sound.isPlaying || pendingAutoplay;
  loadTrack(currentTrackIndex + step, shouldAutoplay);
}

playBtn?.addEventListener("click", () => {
  playSound();
});

stopBtn?.addEventListener("click", () => {
  stopSound();
});

nextBtn?.addEventListener("click", () => {
  changeTrack(1);
});

prevBtn?.addEventListener("click", () => {
  changeTrack(-1);
});

updateTrackLabel();
startOverlayVideoLoop();

function startOverlayVideoLoop() {
  if (!videoOverlayEl || !overlayVideoEl) return;
  if (!overlayVideos.length || videoIntervalId) {
    return;
  }

  const triggerOverlayGlitch = (duration = 480) => {
    if (!videoOverlayEl) return;
    if (glitchTimeoutId) {
      window.clearTimeout(glitchTimeoutId);
    }
    videoOverlayEl.classList.add("glitching");
    glitchTimeoutId = window.setTimeout(() => {
      videoOverlayEl.classList.remove("glitching");
    }, duration);
    
    // Add extra flicker effect for more visibility
    let flickerCount = 0;
    const flickerInterval = setInterval(() => {
      if (flickerCount >= 6 || !videoOverlayEl.classList.contains("glitching")) {
        clearInterval(flickerInterval);
        return;
      }
      videoOverlayEl.classList.toggle("glitching");
      setTimeout(() => {
        if (flickerCount < 6) videoOverlayEl.classList.add("glitching");
      }, 20);
      flickerCount++;
    }, 80);
  };

  const concludeOverlay = () => {
    if (!overlayIsActive) return;
    overlayVideoEl.pause();
    overlayVideoEl.removeAttribute("src");
    overlayVideoEl.load();
    
    // Remove active glitch effect
    videoOverlayEl.classList.remove("active-glitch");
    
    // Reset video transform
    if (videoOverlayEl) {
      videoOverlayEl.style.transform = "scale(1.0)";
    }
    
    // Restore original palette based on current track
    applyColorPalette(currentTrackIndex);
    
    triggerOverlayGlitch(400);
    window.setTimeout(() => {
      videoOverlayEl.classList.remove("visible");
      overlayIsActive = false;
    }, 220);
  };

  overlayVideoEl.addEventListener("ended", concludeOverlay);
  overlayVideoEl.addEventListener("error", concludeOverlay);

  videoIntervalId = window.setInterval(() => {
    if (overlayIsActive) return;
    if (!sound.isPlaying) return; // Don't play videos if song isn't playing
    if (Math.random() > VIDEO_APPEAR_CHANCE) return;
    const choice =
      overlayVideos[Math.floor(Math.random() * overlayVideos.length)];
    if (!choice) return;
    
    // Randomly pick a color palette when video loads
    const randomPaletteIndex = Math.floor(Math.random() * colorPalettes.length);
    applyColorPalette(randomPaletteIndex);
    
    overlayIsActive = true;
    videoOverlayEl.classList.add("visible");
    triggerOverlayGlitch(650); // Longer glitch duration for more visibility
    overlayVideoEl.src = `./video/${choice}`;
    overlayVideoEl.currentTime = 0;
    
    overlayVideoEl.onplaying = () => {
      // Add subtle continuous glitch when video starts playing
      if (videoOverlayEl) {
        videoOverlayEl.classList.add("active-glitch");
      }
    };
    
    overlayVideoEl.onpause = () => {
      // Remove subtle glitch if video is paused
      if (videoOverlayEl) {
        videoOverlayEl.classList.remove("active-glitch");
      }
    };
    
    overlayVideoEl.play().catch((error) => {
      console.warn("Overlay video failed to play:", error);
      concludeOverlay();
    });
  }, VIDEO_CHECK_INTERVAL);
}

// === Color Palettes ===
const colorPalettes = [
  // Palette 0: Original (Cyan/Magenta/Orange/White)
  {
    name: "Original",
    skybox: {
      baseColor1: { x: 0.0, y: 0.02, z: 0.05 },
      baseColor2: { x: 0.0, y: 0.05, z: 0.09 },
      pulseTint1: { x: 0.0, y: 0.2, z: 0.5 },
      pulseTint2: { x: 0.0, y: 0.5, z: 0.9 },
      toneShift: { x: 0.6, y: 0.8, z: 1.5 },
    },
    ring1: { color: 0xff00cc, emissive: 0xff00cc },
    ring2: { color: 0xff9900, emissive: 0xff5500 },
    ring3: { color: 0xffffff, emissive: 0xffffff },
    ring4: { color: 0x00ccff, emissive: 0x00ccff },
    ring5: { color: 0xcc00ff, emissive: 0xcc00ff },
    ring6: { color: 0x00ffaa, emissive: 0x00ffaa },
    ring7: { color: 0xffcc00, emissive: 0xffcc00 },
    ring8: { color: 0xff00aa, emissive: 0xff00aa },
    ring9: { color: 0x00ccff, emissive: 0x00ccff },
    inner: { color: 0x00aaff, emissive: 0x00ffff },
    outline: { visible: "#00ffff", hidden: "#ff0088" },
  },
  // Palette 1: Neon Green/Purple
  {
    name: "Neon Cyber",
    skybox: {
      baseColor1: { x: 0.02, y: 0.0, z: 0.05 },
      baseColor2: { x: 0.05, y: 0.0, z: 0.09 },
      pulseTint1: { x: 0.2, y: 0.0, z: 0.5 },
      pulseTint2: { x: 0.6, y: 0.0, z: 0.9 },
      toneShift: { x: 1.2, y: 0.6, z: 1.5 },
    },
    ring1: { color: 0x00ff88, emissive: 0x00ff88 },
    ring2: { color: 0xaa00ff, emissive: 0xcc44ff },
    ring3: { color: 0xffff00, emissive: 0xffff00 },
    ring4: { color: 0x44ffdd, emissive: 0x44ffdd },
    ring5: { color: 0xff44aa, emissive: 0xff44aa },
    ring6: { color: 0x88ff44, emissive: 0x88ff44 },
    ring7: { color: 0xffff00, emissive: 0xffff00 },
    ring8: { color: 0xff00cc, emissive: 0xff00cc },
    ring9: { color: 0x44ffff, emissive: 0x44ffff },
    inner: { color: 0x00ffaa, emissive: 0x44ffdd },
    outline: { visible: "#00ff88", hidden: "#ff00aa" },
  },
  // Palette 2: Fire/Red/Orange
  {
    name: "Inferno",
    skybox: {
      baseColor1: { x: 0.05, y: 0.0, z: 0.0 },
      baseColor2: { x: 0.09, y: 0.02, z: 0.0 },
      pulseTint1: { x: 0.5, y: 0.1, z: 0.0 },
      pulseTint2: { x: 0.9, y: 0.3, z: 0.0 },
      toneShift: { x: 1.5, y: 0.8, z: 0.6 },
    },
    ring1: { color: 0xff4400, emissive: 0xff4400 },
    ring2: { color: 0xffaa00, emissive: 0xff8800 },
    ring3: { color: 0xffff44, emissive: 0xffff44 },
    ring4: { color: 0xff6600, emissive: 0xff6600 },
    ring5: { color: 0xff0088, emissive: 0xff0088 },
    ring6: { color: 0xffcc44, emissive: 0xffcc44 },
    ring7: { color: 0xffaa00, emissive: 0xffaa00 },
    ring8: { color: 0xff0088, emissive: 0xff0088 },
    ring9: { color: 0xff6600, emissive: 0xff6600 },
    inner: { color: 0xff6600, emissive: 0xff8844 },
    outline: { visible: "#ff4400", hidden: "#ff0088" },
  },
  // Palette 3: Ocean/Blue/Cyan
  {
    name: "Ocean Depth",
    skybox: {
      baseColor1: { x: 0.0, y: 0.02, z: 0.05 },
      baseColor2: { x: 0.0, y: 0.08, z: 0.12 },
      pulseTint1: { x: 0.0, y: 0.3, z: 0.6 },
      pulseTint2: { x: 0.0, y: 0.7, z: 1.0 },
      toneShift: { x: 0.6, y: 1.0, z: 1.5 },
    },
    ring1: { color: 0x0099ff, emissive: 0x0099ff },
    ring2: { color: 0x00ccff, emissive: 0x44ddff },
    ring3: { color: 0x88ffff, emissive: 0x88ffff },
    ring4: { color: 0x0066ff, emissive: 0x0066ff },
    ring5: { color: 0x44aaff, emissive: 0x44aaff },
    ring6: { color: 0x66ddff, emissive: 0x66ddff },
    ring7: { color: 0x0099ff, emissive: 0x0099ff },
    ring8: { color: 0x00aaff, emissive: 0x00aaff },
    ring9: { color: 0x66ddff, emissive: 0x66ddff },
    inner: { color: 0x00aaff, emissive: 0x66ddff },
    outline: { visible: "#00ccff", hidden: "#0066ff" },
  },
  // Palette 4: Purple/Violet/Pink
  {
    name: "Royal Purple",
    skybox: {
      baseColor1: { x: 0.05, y: 0.0, z: 0.05 },
      baseColor2: { x: 0.09, y: 0.02, z: 0.09 },
      pulseTint1: { x: 0.5, y: 0.0, z: 0.5 },
      pulseTint2: { x: 0.8, y: 0.2, z: 1.0 },
      toneShift: { x: 1.2, y: 0.7, z: 1.3 },
    },
    ring1: { color: 0xaa00ff, emissive: 0xaa00ff },
    ring2: { color: 0xff00cc, emissive: 0xff44dd },
    ring3: { color: 0xff88ff, emissive: 0xff88ff },
    ring4: { color: 0xcc00ff, emissive: 0xcc00ff },
    ring5: { color: 0xff44ff, emissive: 0xff44ff },
    ring6: { color: 0xdd88ff, emissive: 0xdd88ff },
    ring7: { color: 0xaa00ff, emissive: 0xaa00ff },
    ring8: { color: 0xff00aa, emissive: 0xff00aa },
    ring9: { color: 0xff44ff, emissive: 0xff44ff },
    inner: { color: 0xcc44ff, emissive: 0xdd66ff },
    outline: { visible: "#aa00ff", hidden: "#ff00aa" },
  },
  // Palette 5: Electric Yellow/Blue
  {
    name: "Electric Shock",
    skybox: {
      baseColor1: { x: 0.04, y: 0.04, z: 0.0 },
      baseColor2: { x: 0.08, y: 0.08, z: 0.02 },
      pulseTint1: { x: 0.6, y: 0.6, z: 0.0 },
      pulseTint2: { x: 1.0, y: 1.0, z: 0.3 },
      toneShift: { x: 1.4, y: 1.4, z: 0.8 },
    },
    ring1: { color: 0xffff00, emissive: 0xffff00 },
    ring2: { color: 0x00ffff, emissive: 0x44ffff },
    ring3: { color: 0xffffff, emissive: 0xffffff },
    ring4: { color: 0xffff44, emissive: 0xffff44 },
    ring5: { color: 0x44ffff, emissive: 0x44ffff },
    ring6: { color: 0xffff88, emissive: 0xffff88 },
    ring7: { color: 0xffff00, emissive: 0xffff00 },
    ring8: { color: 0xff00ff, emissive: 0xff00ff },
    ring9: { color: 0x00ffff, emissive: 0x00ffff },
    inner: { color: 0xffff44, emissive: 0xffff88 },
    outline: { visible: "#ffff00", hidden: "#00ffff" },
  },
  // Palette 6: Mint/Teal/Cyan
  {
    name: "Aqua",
    skybox: {
      baseColor1: { x: 0.0, y: 0.05, z: 0.06 },
      baseColor2: { x: 0.0, y: 0.08, z: 0.1 },
      pulseTint1: { x: 0.0, y: 0.4, z: 0.5 },
      pulseTint2: { x: 0.0, y: 0.7, z: 0.9 },
      toneShift: { x: 0.7, y: 1.2, z: 1.4 },
    },
    ring1: { color: 0x00ffcc, emissive: 0x00ffcc },
    ring2: { color: 0x00aaff, emissive: 0x44ccff },
    ring3: { color: 0x88ffff, emissive: 0x88ffff },
    ring4: { color: 0x00ffaa, emissive: 0x00ffaa },
    ring5: { color: 0x66ffdd, emissive: 0x66ffdd },
    ring6: { color: 0x44ffee, emissive: 0x44ffee },
    ring7: { color: 0x00ffcc, emissive: 0x00ffcc },
    ring8: { color: 0x00ff88, emissive: 0x00ff88 },
    ring9: { color: 0x44ffff, emissive: 0x44ffff },
    inner: { color: 0x44ffdd, emissive: 0x66ffee },
    outline: { visible: "#00ffcc", hidden: "#00aaff" },
  },
  // Palette 7: Sunset/Orange/Pink
  {
    name: "Sunset",
    skybox: {
      baseColor1: { x: 0.05, y: 0.02, z: 0.0 },
      baseColor2: { x: 0.12, y: 0.05, z: 0.02 },
      pulseTint1: { x: 0.8, y: 0.3, z: 0.0 },
      pulseTint2: { x: 1.0, y: 0.5, z: 0.2 },
      toneShift: { x: 1.5, y: 1.1, z: 0.7 },
    },
    ring1: { color: 0xff6600, emissive: 0xff6600 },
    ring2: { color: 0xff0088, emissive: 0xff4488 },
    ring3: { color: 0xffaa44, emissive: 0xffaa44 },
    ring4: { color: 0xff8844, emissive: 0xff8844 },
    ring5: { color: 0xffaa66, emissive: 0xffaa66 },
    ring6: { color: 0xffcc88, emissive: 0xffcc88 },
    ring7: { color: 0xff9900, emissive: 0xff9900 },
    ring8: { color: 0xff6688, emissive: 0xff6688 },
    ring9: { color: 0xff8844, emissive: 0xff8844 },
    inner: { color: 0xff8844, emissive: 0xffaa66 },
    outline: { visible: "#ff6600", hidden: "#ff0088" },
  },
  // Palette 8: Ice/Cyan/White
  {
    name: "Arctic",
    skybox: {
      baseColor1: { x: 0.0, y: 0.04, z: 0.06 },
      baseColor2: { x: 0.02, y: 0.08, z: 0.12 },
      pulseTint1: { x: 0.0, y: 0.4, z: 0.7 },
      pulseTint2: { x: 0.3, y: 0.8, z: 1.0 },
      toneShift: { x: 0.8, y: 1.1, z: 1.4 },
    },
    ring1: { color: 0x88ddff, emissive: 0x88ddff },
    ring2: { color: 0xccffff, emissive: 0xddeeff },
    ring3: { color: 0xffffff, emissive: 0xffffff },
    ring4: { color: 0x44aaff, emissive: 0x44aaff },
    ring5: { color: 0x88ccff, emissive: 0x88ccff },
    ring6: { color: 0xaaddff, emissive: 0xaaddff },
    ring7: { color: 0x88ddff, emissive: 0x88ddff },
    ring8: { color: 0xaaeeff, emissive: 0xaaeeff },
    ring9: { color: 0xccffff, emissive: 0xccffff },
    inner: { color: 0xaaffff, emissive: 0xccffff },
    outline: { visible: "#88ddff", hidden: "#44aaff" },
  },
  // Palette 9: Dark Purple/Blue
  {
    name: "Cosmic",
    skybox: {
      baseColor1: { x: 0.02, y: 0.0, z: 0.08 },
      baseColor2: { x: 0.05, y: 0.02, z: 0.12 },
      pulseTint1: { x: 0.4, y: 0.0, z: 0.7 },
      pulseTint2: { x: 0.6, y: 0.3, z: 1.0 },
      toneShift: { x: 1.1, y: 0.7, z: 1.4 },
    },
    ring1: { color: 0x6600ff, emissive: 0x6600ff },
    ring2: { color: 0x4400ff, emissive: 0x6644ff },
    ring3: { color: 0xaa88ff, emissive: 0xaa88ff },
    ring4: { color: 0x8844ff, emissive: 0x8844ff },
    ring5: { color: 0xaa66ff, emissive: 0xaa66ff },
    ring6: { color: 0xcc88ff, emissive: 0xcc88ff },
    ring7: { color: 0x6600ff, emissive: 0x6600ff },
    ring8: { color: 0x9900ff, emissive: 0x9900ff },
    ring9: { color: 0xaa66ff, emissive: 0xaa66ff },
    inner: { color: 0x8844ff, emissive: 0xaa66ff },
    outline: { visible: "#6600ff", hidden: "#4400ff" },
  },
];

// === Shader Skybox (stronger beat pulse) ===
const skyUniforms = {
  uTime: { value: 0 },
  uAudio: { value: 0.0 },
  uBaseColor1: { value: new THREE.Vector3(0.0, 0.02, 0.05) },
  uBaseColor2: { value: new THREE.Vector3(0.0, 0.05, 0.09) },
  uPulseTint1: { value: new THREE.Vector3(0.0, 0.2, 0.5) },
  uPulseTint2: { value: new THREE.Vector3(0.0, 0.5, 0.9) },
  uToneShift: { value: new THREE.Vector3(0.6, 0.8, 1.5) },
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
    uniform vec3 uBaseColor1;
    uniform vec3 uBaseColor2;
    uniform vec3 uPulseTint1;
    uniform vec3 uPulseTint2;
    uniform vec3 uToneShift;

    float hash(vec3 p) {
      p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    void main() {
      vec3 dir = normalize(vWorldPosition);
      float t = uTime * 0.05;

      // Enhanced visibility for grid
      float stripes = abs(sin(dir.y * 100.0 + t * 30.0)) * 0.18;
      float grid = abs(sin(dir.x * 50.0 + t * 40.0) * sin(dir.z * 50.0 - t * 40.0)) * 0.18;
      float n = hash(dir * 100.0 + t * 10.0) * 0.03;

      // Base darker gradient (using uniforms)
      vec3 baseColor = mix(uBaseColor1, uBaseColor2, dir.y * 0.5 + 0.5);

      // Punchier pulse with palette tones
      float pulse = smoothstep(0.0, 1.0, uAudio) * 0.5;
      vec3 pulseTint = mix(uPulseTint1, uPulseTint2, pulse);
      baseColor += pulseTint * pulse;

      // Beat glow around grid lines
      float glow = pow(stripes + grid, 2.0) * (0.4 + pulse * 1.6);
      vec3 color = baseColor + vec3(glow + n) * 1.1;

      // Add subtle tone-shift to make pulse visible (using uniform)
      color = mix(color, color * uToneShift, pulse * 0.6);

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

// === Outer Rings ===
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

// === Second Ring (orange) ===
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

// === Third Ring (white) ===
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

// === Fourth Ring (cyan/blue) - Pulse with bass ===
const bars4 = [];
const outerRadius4 = outerRadius3 + 1.2;
const rotationOffset3 = rotationOffset2 * 1.5;
for (let i = 0; i < outerCount; i++) {
  const geometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
  const material = new THREE.MeshStandardMaterial({
    color: 0x00ccff,
    emissive: 0x00ccff,
    emissiveIntensity: 0.4,
    metalness: 0.85,
    roughness: 0.2,
  });
  const bar = new THREE.Mesh(geometry, material);
  const angle = (i / outerCount) * Math.PI * 2 + rotationOffset3;
  bar.position.x = Math.cos(angle) * outerRadius4;
  bar.position.z = Math.sin(angle) * outerRadius4;
  bar.rotation.y = -angle;
  scene.add(bar);
  bars4.push(bar);
}

// === Fifth Ring (purple/violet) - Reacts to high frequencies ===
const bars5 = [];
const outerRadius5 = outerRadius4 + 1.2;
const rotationOffset4 = rotationOffset3 * 1.3;
for (let i = 0; i < outerCount; i++) {
  const geometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
  const material = new THREE.MeshStandardMaterial({
    color: 0xcc00ff,
    emissive: 0xcc00ff,
    emissiveIntensity: 0.4,
    metalness: 0.9,
    roughness: 0.18,
  });
  const bar = new THREE.Mesh(geometry, material);
  const angle = (i / outerCount) * Math.PI * 2 + rotationOffset4;
  bar.position.x = Math.cos(angle) * outerRadius5;
  bar.position.z = Math.sin(angle) * outerRadius5;
  bar.rotation.y = -angle;
  scene.add(bar);
  bars5.push(bar);
}

// === Sixth Ring (green/teal) - Wave-like reaction ===
const bars6 = [];
const outerRadius6 = outerRadius5 + 1.2;
const rotationOffset5 = rotationOffset4 * 1.4;
for (let i = 0; i < outerCount; i++) {
  const geometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
  const material = new THREE.MeshStandardMaterial({
    color: 0x00ffaa,
    emissive: 0x00ffaa,
    emissiveIntensity: 0.4,
    metalness: 0.8,
    roughness: 0.22,
  });
  const bar = new THREE.Mesh(geometry, material);
  const angle = (i / outerCount) * Math.PI * 2 + rotationOffset5;
  bar.position.x = Math.cos(angle) * outerRadius6;
  bar.position.z = Math.sin(angle) * outerRadius6;
  bar.rotation.y = -angle;
  scene.add(bar);
  bars6.push(bar);
}

// === Seventh Ring (golden yellow) - Rotating chase with spinning bars ===
const bars7 = [];
const outerRadius7 = outerRadius6 + 1.2;
const rotationOffset6 = rotationOffset5 * 1.15;
for (let i = 0; i < outerCount; i++) {
  const geometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    emissive: 0xffcc00,
    emissiveIntensity: 0.35,
    metalness: 0.9,
    roughness: 0.18,
  });
  const bar = new THREE.Mesh(geometry, material);
  const angle = (i / outerCount) * Math.PI * 2 + rotationOffset6;
  bar.position.x = Math.cos(angle) * outerRadius7;
  bar.position.z = Math.sin(angle) * outerRadius7;
  bar.rotation.y = -angle;
  scene.add(bar);
  bars7.push(bar);
}

// === Eighth Ring (magenta/pink) - Spiral flow effect ===
const bars8 = [];
const outerRadius8 = outerRadius7 + 1.2;
const rotationOffset7 = rotationOffset6 * 1.25;
for (let i = 0; i < outerCount; i++) {
  const geometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff00aa,
    emissive: 0xff00aa,
    emissiveIntensity: 0.35,
    metalness: 0.88,
    roughness: 0.2,
  });
  const bar = new THREE.Mesh(geometry, material);
  const angle = (i / outerCount) * Math.PI * 2 + rotationOffset7;
  bar.position.x = Math.cos(angle) * outerRadius8;
  bar.position.z = Math.sin(angle) * outerRadius8;
  bar.rotation.y = -angle;
  scene.add(bar);
  bars8.push(bar);
}

// === Ninth Ring (cyan/blue) - Radial pulse with phase offset ===
const bars9 = [];
const outerRadius9 = outerRadius8 + 1.2;
const rotationOffset8 = rotationOffset7 * 1.2;
for (let i = 0; i < outerCount; i++) {
  const geometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
  const material = new THREE.MeshStandardMaterial({
    color: 0x00ccff,
    emissive: 0x00ccff,
    emissiveIntensity: 0.35,
    metalness: 0.85,
    roughness: 0.22,
  });
  const bar = new THREE.Mesh(geometry, material);
  const angle = (i / outerCount) * Math.PI * 2 + rotationOffset8;
  bar.position.x = Math.cos(angle) * outerRadius9;
  bar.position.z = Math.sin(angle) * outerRadius9;
  bar.rotation.y = -angle;
  scene.add(bar);
  bars9.push(bar);
}

// === Inner "city" ===
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
    const h = THREE.MathUtils.lerp(2.2, 0.1, t);
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

// === Color Palette Function ===
function applyColorPalette(paletteIndex) {
  const palette = colorPalettes[paletteIndex % colorPalettes.length];
  
  // Update skybox shader uniforms
  const sky = palette.skybox;
  skyUniforms.uBaseColor1.value.set(sky.baseColor1.x, sky.baseColor1.y, sky.baseColor1.z);
  skyUniforms.uBaseColor2.value.set(sky.baseColor2.x, sky.baseColor2.y, sky.baseColor2.z);
  skyUniforms.uPulseTint1.value.set(sky.pulseTint1.x, sky.pulseTint1.y, sky.pulseTint1.z);
  skyUniforms.uPulseTint2.value.set(sky.pulseTint2.x, sky.pulseTint2.y, sky.pulseTint2.z);
  skyUniforms.uToneShift.value.set(sky.toneShift.x, sky.toneShift.y, sky.toneShift.z);
  
  // Update ring materials
  bars.forEach(bar => {
    bar.material.color.setHex(palette.ring1.color);
    bar.material.emissive.setHex(palette.ring1.emissive);
  });
  
  bars2.forEach(bar => {
    bar.material.color.setHex(palette.ring2.color);
    bar.material.emissive.setHex(palette.ring2.emissive);
  });
  
  bars3.forEach(bar => {
    bar.material.color.setHex(palette.ring3.color);
    bar.material.emissive.setHex(palette.ring3.emissive);
  });
  
  bars4.forEach(bar => {
    bar.material.color.setHex(palette.ring4.color);
    bar.material.emissive.setHex(palette.ring4.emissive);
  });
  
  bars5.forEach(bar => {
    bar.material.color.setHex(palette.ring5.color);
    bar.material.emissive.setHex(palette.ring5.emissive);
  });
  
  bars6.forEach(bar => {
    bar.material.color.setHex(palette.ring6.color);
    bar.material.emissive.setHex(palette.ring6.emissive);
  });
  
  bars7.forEach(bar => {
    bar.material.color.setHex(palette.ring7.color);
    bar.material.emissive.setHex(palette.ring7.emissive);
  });
  
  bars8.forEach(bar => {
    bar.material.color.setHex(palette.ring8.color);
    bar.material.emissive.setHex(palette.ring8.emissive);
  });
  
  bars9.forEach(bar => {
    bar.material.color.setHex(palette.ring9.color);
    bar.material.emissive.setHex(palette.ring9.emissive);
  });
  
  // Update inner buildings
  innerBuildings.forEach(({ mesh }) => {
    mesh.material.color.setHex(palette.inner.color);
    mesh.material.emissive.setHex(palette.inner.emissive);
  });
  
  // Update outline pass colors
  outlinePass.visibleEdgeColor.set(palette.outline.visible);
  outlinePass.hiddenEdgeColor.set(palette.outline.hidden);
}

// Apply initial palette
applyColorPalette(currentTrackIndex);

// === Animate ===
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const data = analyser.getFrequencyData();
  const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
  
  // Better beat detection using bass frequencies (better for rhythm)
  const bassAvg = (data[0] + data[1] + data[2] + data[3] + data[4]) / 5 / 255;
  const midAvg = data.reduce((a, b, idx) => idx > 4 && idx < data.length * 0.5 ? a + b : a, 0) / (Math.floor(data.length * 0.5) - 5) / 255;
  
  // Moderate beat sensitivity enhancement - more noticeable but not extreme
  const beatBoost = bassAvg > 0.22 ? 1.0 + bassAvg * 0.5 : 1.0;

  skyUniforms.uTime.value = clock.getElapsedTime();
  skyUniforms.uAudio.value = avg;

  // Bars animation - moderate rhythm response enhancement
  for (let i = 0; i < bars.length; i++) {
    const freq = data[i % data.length];
    const normalized = freq / 255;
    // Moderate boost for more noticeable beats
    const scale = normalized * 10.0 * beatBoost + 0.5;
    bars[i].scale.y = scale;
    bars[i].position.y = scale / 2;
    bars[i].material.emissiveIntensity = 0.3 + normalized * 0.9 * beatBoost;
  }

  for (let i = 0; i < bars2.length; i++) {
    const freq = data[(i * 2) % data.length];
    const inverted = 1.0 - freq / 255;
    // Moderate response enhancement to rhythm changes
    const scale = inverted * 10.0 * beatBoost + 0.5;
    bars2[i].scale.y = scale;
    bars2[i].position.y = scale / 2;
    bars2[i].material.emissiveIntensity = 0.3 + inverted * 0.9 * beatBoost;
  }

  for (let i = 0; i < bars3.length; i++) {
    const freq = data[(i * 3) % data.length];
    const normalized = freq / 255;
    const smooth = (Math.sin(Date.now() * 0.002 + i * 0.1) + 1) / 2;
    // Moderate mid-frequency response enhancement
    const scale = (normalized * 8.0 * beatBoost + 0.5) * (0.8 + 0.2 * smooth);
    bars3[i].scale.y = scale;
    bars3[i].position.y = scale / 2;
    bars3[i].material.emissiveIntensity = 0.3 + normalized * 0.7 * beatBoost;
  }

  // Ring 4 - Reacts strongly to bass frequencies with pulse effect
  for (let i = 0; i < bars4.length; i++) {
    const bassIndex = Math.floor((i / bars4.length) * 8); // Use first 8 frequencies for bass
    const bassFreq = data[bassIndex] || 0;
    const normalized = bassFreq / 255;
    // Pulse effect that syncs with bass
    const pulse = (Math.sin(Date.now() * 0.003 + i * 0.15) + 1) / 2;
    const scale = normalized * 9.0 * beatBoost * (0.9 + 0.2 * pulse) + 0.5;
    bars4[i].scale.y = scale;
    bars4[i].position.y = scale / 2;
    bars4[i].material.emissiveIntensity = 0.3 + normalized * 0.95 * beatBoost * (0.8 + 0.3 * pulse);
  }

  // Ring 5 - Reacts to high frequencies with inverted wave
  for (let i = 0; i < bars5.length; i++) {
    const highIndex = data.length - 1 - (i % 16); // Use last 16 frequencies
    const highFreq = data[Math.max(0, highIndex)] || 0;
    const normalized = highFreq / 255;
    const inverted = 1.0 - normalized;
    // Wave pattern that moves opposite to frequency
    const wave = (Math.cos(Date.now() * 0.004 + i * 0.12) + 1) / 2;
    const scale = inverted * 8.2 * beatBoost * (0.85 + 0.25 * wave) + 0.5;
    bars5[i].scale.y = scale;
    bars5[i].position.y = scale / 2;
    bars5[i].material.emissiveIntensity = 0.3 + inverted * 0.85 * beatBoost * (0.9 + 0.2 * wave);
  }

  // Ring 6 - Wave reaction that travels around the circle
  for (let i = 0; i < bars6.length; i++) {
    const freq = data[(i * 4) % data.length];
    const normalized = freq / 255;
    // Traveling wave effect
    const wavePhase = (i / bars6.length) * Math.PI * 2 + Date.now() * 0.001;
    const wave = (Math.sin(wavePhase * 3) + 1) / 2;
    // Combines frequency with traveling wave - moderate enhancement
    const scale = normalized * 8.5 * beatBoost * (0.7 + 0.4 * wave) + 0.5;
    bars6[i].scale.y = scale;
    bars6[i].position.y = scale / 2;
    bars6[i].material.emissiveIntensity = 0.3 + normalized * 0.9 * beatBoost * (0.8 + 0.3 * wave);
  }

  // Ring 7 - Complex 3D tumbling with mid-frequency response and wobble effect
  for (let i = 0; i < bars7.length; i++) {
    // Focus on mid frequencies for this ring
    const midIndex = Math.floor(data.length * 0.3) + (i % Math.floor(data.length * 0.4));
    const freq = data[midIndex] || 0;
    const normalized = freq / 255;
    
    // Complex multi-layered phase for tumbling motion
    const time = Date.now() * 0.002;
    const angle = (i / bars7.length) * Math.PI * 2;
    const tumblingPhase = angle + time * 1.8;
    
    // Multi-layered wave pattern creating complex motion
    const wave1 = Math.sin(tumblingPhase * 2.5) * 0.5;
    const wave2 = Math.cos(tumblingPhase * 1.7 + time * 2) * 0.3;
    const wave3 = Math.sin(tumblingPhase * 3.3 - time * 1.5) * 0.2;
    const combinedWave = (wave1 + wave2 + wave3 + 1) / 2;
    
    // Dynamic scaling with complex wave modulation - moderate enhancement
    const baseScale = normalized * 8.0 * beatBoost;
    const scale = baseScale * (0.7 + 0.4 * combinedWave) + 0.5;
    bars7[i].scale.y = scale;
    bars7[i].position.y = scale / 2;
    
    // Complex 3D rotation creating tumbling effect
    bars7[i].rotation.x = Math.sin(tumblingPhase * 1.5 + time) * 0.45 + Math.cos(time * 1.2) * 0.15;
    bars7[i].rotation.y = -angle + Math.sin(tumblingPhase * 2.1) * 0.3;
    bars7[i].rotation.z = Math.cos(tumblingPhase * 1.8 - time * 1.3) * 0.35 + Math.sin(time * 0.9) * 0.2;
    
    // Wobble effect on position for extra dynamism
    const wobbleX = Math.sin(time * 2.1 + angle * 3) * 0.08 * (1 + normalized);
    const wobbleZ = Math.cos(time * 1.7 + angle * 2.5) * 0.08 * (1 + normalized);
    const originalAngle = angle + rotationOffset6;
    bars7[i].position.x = Math.cos(originalAngle) * outerRadius7 + wobbleX;
    bars7[i].position.z = Math.sin(originalAngle) * outerRadius7 + wobbleZ;
    
    bars7[i].material.emissiveIntensity = 0.3 + normalized * 0.8 * beatBoost * (0.8 + 0.3 * combinedWave);
  }

  // Ring 8 - Enhanced multi-layered spiral with radial expansion/contraction and high-frequency response
  for (let i = 0; i < bars8.length; i++) {
    // Focus on high frequencies for this ring
    const highIndex = Math.max(0, data.length - 1 - (i % 20));
    const freq = data[highIndex] || 0;
    const normalized = freq / 255;
    
    const time = Date.now() * 0.0018;
    const angle = (i / bars8.length) * Math.PI * 2;
    // Multi-turn spiral phase for complex flow
    const spiralPhase = angle * 6 + time * 2.2;
    
    // Multi-layered spiral wave pattern
    const spiral1 = Math.sin(spiralPhase);
    const spiral2 = Math.cos(spiralPhase * 0.65 + time * 1.8);
    const spiral3 = Math.sin(spiralPhase * 1.3 - time * 1.2);
    const layeredSpiral = ((spiral1 + spiral2 * 0.6 + spiral3 * 0.4) / 2 + 1) / 2;
    
    // Radial expansion/contraction effect
    const radialPhase = (i / bars8.length) * Math.PI * 4 + time * 1.5;
    const radialExpand = (Math.sin(radialPhase) + 1) / 2;
    const radiusMod = outerRadius8 * (0.96 + 0.08 * radialExpand * (0.5 + normalized));
    
    // Strong beat response - audio directly affects scale, spiral adds variation - moderate enhancement
    const beatScale = normalized * 8.0 * beatBoost; // Direct beat response - moderate boost
    const spiralMod = 0.7 + 0.3 * layeredSpiral; // Spiral adds gentle variation
    const scale = beatScale * spiralMod + 0.5; // Beat is primary, spiral is secondary
    bars8[i].scale.y = scale;
    bars8[i].position.y = scale / 2;
    
    // Enhanced spiral rotation with radial variation
    const originalAngle = angle + rotationOffset7;
    const baseYRot = -originalAngle;
    const spiralRot = Math.sin(spiralPhase * 1.2) * 0.4;
    const radialTilt = Math.cos(radialPhase * 1.5) * 0.2;
    bars8[i].rotation.y = baseYRot + spiralRot + radialTilt;
    bars8[i].rotation.x = Math.sin(spiralPhase * 0.9) * 0.25 * (0.8 + normalized * beatBoost);
    bars8[i].rotation.z = Math.cos(spiralPhase * 1.1 + time) * 0.2;
    
    // Apply radial expansion to position using original angle - enhanced with beat
    const beatRadiusMod = 1.0 + (normalized * beatBoost * 0.06); // Beat affects radius moderately
    bars8[i].position.x = Math.cos(originalAngle) * radiusMod * beatRadiusMod;
    bars8[i].position.z = Math.sin(originalAngle) * radiusMod * beatRadiusMod;
    
    bars8[i].material.emissiveIntensity = 0.28 + normalized * 0.9 * beatBoost * (0.85 + 0.25 * layeredSpiral);
  }

  // Ring 9 - Smooth traveling wave pattern with beat response
  for (let i = 0; i < bars9.length; i++) {
    // Beat response using bass frequencies
    const bassIndex = Math.floor((i / bars9.length) * 12);
    const bassFreq = data[bassIndex] || 0;
    const normalized = bassFreq / 255;
    
    const time = Date.now() * 0.0015; // Smooth wave speed
    const angle = (i / bars9.length) * Math.PI * 2;
    
    // Smooth traveling wave that moves around the circle
    const wavePhase = angle + time * 1.8; // Wave travels around the circle
    const wave = (Math.sin(wavePhase * 2) + 1) / 2; // Smooth sine wave 0-1
    
    // Beat response affects the wave amplitude - moderate enhancement
    const beatWave = normalized * beatBoost;
    
    // Wave-like scaling - moderate enhancement for more noticeable beats
    const baseScale = beatWave * 5.5; // Moderate increase for noticeable beats
    const waveModulation = 0.6 + 0.4 * wave; // Wave varies from 0.6 to 1.0
    const scale = baseScale * waveModulation + 0.4; // Lower minimum scale (lower overall height)
    bars9[i].scale.y = scale;
    bars9[i].position.y = scale / 2;
    
    // Gentle wave rotation for smooth visual effect
    bars9[i].rotation.z = Math.sin(wavePhase * 1.5) * 0.08; // Subtle wave rotation
    bars9[i].rotation.x = Math.cos(wavePhase * 0.8) * 0.06; // Gentle tilt
    bars9[i].rotation.y = -angle - rotationOffset8; // Maintain base rotation
    
    // Keep position stable (no radial expansion)
    const baseAngle = angle + rotationOffset8;
    bars9[i].position.x = Math.cos(baseAngle) * outerRadius9;
    bars9[i].position.z = Math.sin(baseAngle) * outerRadius9;
    
    // Wave-like emissive intensity - moderate enhancement
    bars9[i].material.emissiveIntensity = 0.25 + beatWave * 0.65 * (0.8 + 0.2 * wave); // Moderate increase
  }

  for (let k = 0; k < innerBuildings.length; k++) {
    const { mesh, t, i } = innerBuildings[k];
    const index = Math.floor((i / radialCount) * data.length);
    const freq = data[index];
    const intensity = freq / 255;
    const baseHeight = THREE.MathUtils.lerp(2.2, 0.1, t);
    // Moderate beat response enhancement - taller buildings, more noticeable beats
    mesh.scale.y = baseHeight + intensity * (6.0 - t * 2.7) * beatBoost;
    mesh.position.y = mesh.scale.y / 2;
    mesh.material.emissiveIntensity = 0.3 + intensity * 1.1 * beatBoost;
  }

  const avg2 = data.reduce((a, b) => a + b, 0) / data.length;
  const normalizedAvg2 = avg2 / 255;
  // Moderate outline response enhancement to rhythm
  outlinePass.edgeStrength = 6 + normalizedAvg2 * 4.0 * beatBoost;
  outlinePass.pulsePeriod = 2 + normalizedAvg2 * 2.3;

  // Make video overlay "bop" with the beat - moderate enhancement
  if (videoOverlayEl && overlayIsActive) {
    const beatIntensity = avg * beatBoost; // normalized 0-1 with beat boost
    const scale = 1.0 + beatIntensity * 0.13; // Slightly more noticeable with beat boost
    videoOverlayEl.style.transform = `scale(${scale})`;
    videoOverlayEl.style.transition = "transform 0.08s ease-out"; // Slightly faster for more snappy feel
  }

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