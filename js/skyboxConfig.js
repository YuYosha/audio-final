// === Skybox Shader Uniforms Configuration ===
// This function initializes skybox uniforms (needs THREE to be loaded)
function createSkyUniforms(THREE) {
  return {
    uTime: { value: 0 },
    uAudio: { value: 0.0 },
    uBaseColor1: { value: new THREE.Vector3(0.0, 0.02, 0.05) },
    uBaseColor2: { value: new THREE.Vector3(0.0, 0.05, 0.09) },
    uPulseTint1: { value: new THREE.Vector3(0.0, 0.2, 0.5) },
    uPulseTint2: { value: new THREE.Vector3(0.0, 0.5, 0.9) },
    uToneShift: { value: new THREE.Vector3(0.6, 0.8, 1.5) },
  };
}
