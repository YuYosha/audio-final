const tracks = [

  { label: "Jump UP", file: "JumpUp.mp3" },
  { label: "Live and Learn", file: "LiveAndLearn.mp3" },
  { label: "I Feel So Alive", file: "IFeelSoAlive.mp3" },
  { label: "Citrus", file: "Citrus.mp3" },
  { label: "Turbulence", file: "Turbulence.mp3" },

  { label: "Egg Dragoon", file: "EggDragoon.mp3" },
  { label: "Cracked Empire", file: "CrackedEmpire.mp3" },
  { label: "Running The Bassline", file: "RunningTheBassline.mp3" },
  { label: "Terminal Velocity Act1", file: "TerminalVelocityAct1.mp3" },
  { label: "Forever Imperfect", file: "ForeverImperfect.mp3" },
  { label: "Break Free", file: "BreakFree.mp3" },
  { label: "Eg Megalovania", file: "EgMegalovania.mp3" },
  { label: "Metallic Madness", file: "MetallicMadness.mp3" },
  { label: "Drift Around", file: "DriftAround.mp3" },
  { label: "Vs Jacinth", file: "VsJacinth.mp3" },
  { label: "Un Gravitify", file: "UnGravitify.mp3" },
  { label: "Ruder Buster", file: "RuderBuster.mp3" },
  { label: "Extras", file: "Extras.mp3" },
  { label: "Jet Black", file: "JetBlack.mp3" },
  { label: "Aint Nothing Like A Funky Beat", file: "AintNothingLikeAFunkyBeat.mp3" },
  { label: "Touhou", file: "Touhou.mp3" },
  { label: "Touch Fluffy Tail", file: "TouchFluffyTail.mp3" },
  { label: "GET ENUF", file: "GetEnuf.mp3" },
  { label: "Machine Love", file: "MachineLove.mp3" },
  { label: "Blood Drain", file: "BloodDrain.mp3" },
  { label: "Its Going Down Now", file: "ItsGoingDownNow.mp3" },
  { label: "Groovy", file: "Groovy.mp3" },
  { label: "Time To Make History", file: "TimeToMakeHistory.mp3" },
  { label: "Dare", file: "Dare.mp3" },
  { label: "Planet wisp act1", file: "PlanetWispAct1.mp3" },
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

const videoGlitchOverlayEl = document.getElementById("video-glitch-overlay");


// Video overlays (for full-screen overlays)
const overlayVideos = [
  "ani1.mp4",
  "asgore.mp4",
  "Blaze.mp4",
  "candy.mp4",
  "cream.mp4",
  "cream2.mp4",
  "dante.mp4",
  "DC.mp4",
  "eggman.mp4",
  "eggsax.mp4",
  "faust.mp4",
  "funGang.mp4",
  "Iguchi.mp4",
  "joker.mp4",
  "makoto.mp4",
  "makotoP3.mp4",
  "may.mp4",
  "metal.mp4",
  "mez.mp4",
  "morgana.mp4",
  "objection.mp4",
  "pbj.mp4",
  "plan.mp4",
  "ram.mp4",
  "rewrite.mp4",
  "riders.mp4",
  "riders2.mp4",
  "sabrina.mp4",
  "scarlet.mp4",
  "Sch.mp4",
  "sol.mp4",
  "SonicRap.mp4",
  "sonicZ.mp4",
  "teto.mp4",
  "Tiktok.mp4",
  "Xsonic.mp4",
  "yukari.mp4",
  "zzz.mp4",
];

// Popup videos (for error window popups - uses BOTH video and PopUps folders)
// Videos from video folder (these are shared with overlays)
// Unique videos from PopUps folder only (duplicates removed)
const popupVideos = [
  // Videos from video folder (also available for overlays)
  "ani1.mp4",
  "asgore.mp4",
  "Blaze.mp4",
  "candy.mp4",
  "cream.mp4",
  "cream2.mp4",
  "dante.mp4",
  "DC.mp4",
  "eggman.mp4",
  "eggsax.mp4",
  "faust.mp4",
  "funGang.mp4",
  "Iguchi.mp4",
  "joker.mp4",
  "makoto.mp4",
  "makotoP3.mp4",
  "may.mp4",
  "metal.mp4",
  "mez.mp4",
  "morgana.mp4",
  "objection.mp4",
  "pbj.mp4",
  "plan.mp4",
  "ram.mp4",
  "rewrite.mp4",
  "riders.mp4",
  "riders2.mp4",
  "sabrina.mp4",
  "scarlet.mp4",
  "Sch.mp4",
  "sol.mp4",
  "SonicRap.mp4",
  "sonicZ.mp4",
  "teto.mp4",
  "Tiktok.mp4",
  "Xsonic.mp4",
  "yukari.mp4",
  "zzz.mp4",
  // Unique videos from PopUps folder only (duplicates removed)
  "benson.mp4",
  "dodge.mp4",
  "engage.mp4",
  "goku.mp4",
  "gokuB.mp4",
  "gold.mp4",
  "hornet.mp4",
  "jojo.mp4",
  "metroman.mp4",
  "neko.mp4",
  "pipe.mp4",
  "ratdance.mp4",
  "ruby.mp4",
  "rush.mp4",
  "silver.mp4",
  "skull.mp4",
  "smash.mp4",
  "springtrap.mp4",
  "tf2.mp4",
];