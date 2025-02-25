/***********************
 * 3D.js
 *
 * Three.js code for a scrolling grid background
 ***********************/

var scene = new THREE.Scene();
let container = $("#scene-container");

var camera = new THREE.PerspectiveCamera(
  60,
  container.innerWidth() / container.innerHeight(),
  1,
  1000
);

camera.position.set(0, -32, 200);
camera.lookAt(scene.position);

var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.innerWidth(), container.innerHeight());
container.append(renderer.domElement);

// Create a grid that scrolls
var division = 40;
var limit = 200;
var grid = new THREE.GridHelper(limit * 2, division, "white", "white");
// Move the grid a bit lower
grid.translateY(-56);

var moveable = [];
for (let i = 0; i <= division; i++) {
  // Only move horizontal lines
  moveable.push(1, 1, 0, 0);
}

grid.geometry.addAttribute(
  "moveable",
  new THREE.BufferAttribute(new Uint8Array(moveable), 1)
);

grid.material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    limits: { value: new THREE.Vector2(-limit, limit) },
    speed: { value: 5 },
  },
  vertexShader: `
    uniform float time;
    uniform vec2 limits;
    uniform float speed;

    attribute float moveable;
    varying vec3 vColor;

    void main() {
      vColor = color;
      float limLen = limits.y - limits.x;
      vec3 pos = position;

      // If a point is marked "moveable," shift it in z for the illusion
      if (floor(moveable + 0.5) > 0.5){
        float dist = speed * time;
        float currPos = mod((pos.z + dist) - limits.x, limLen) + limits.x;
        pos.z = currPos;
      }

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    void main() {
      gl_FragColor = vec4(vColor, 1.);
    }
  `,
  vertexColors: THREE.VertexColors,
});

scene.add(grid);

var clock = new THREE.Clock();
var time = 0;

function render() {
  requestAnimationFrame(render);
  time += clock.getDelta();
  grid.material.uniforms.time.value = time;
  renderer.render(scene, camera);
}
render();

// Handle window resizing
window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = container.innerWidth() / container.innerHeight();
  camera.updateProjectionMatrix();
  renderer.setSize(container.innerWidth(), container.innerHeight());
}
