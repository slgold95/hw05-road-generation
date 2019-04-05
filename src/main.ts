import {vec2, vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import LSystemHighway from './LSystem/LSystemHighway';
import Plane from './geometry/Plane'; // for 3D plane
import Cube from './geometry/Cube'; // for buildings
import Grid from './geometry/Grid';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  // Added GUI controls for HW5
  'Show Elevation' : false, 
  'Show Population Density': false, 
  'Show Buildings': true, 
};

let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;
let myLSystemHighway: LSystemHighway;
let update: boolean = true;
let groundPlane: Plane; 
let myCube: Cube;
let grid: Grid;

function loadScene() {
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();
  groundPlane = new Plane(vec3.fromValues(0.0, 0.0, 0.0), vec2.fromValues(2.155, 2.155), 8);
  groundPlane.create();
  myCube = new Cube(vec3.fromValues(0.0, 0.0, 0.0));
  myCube.create();
}

function startLSys() {
  // passing in iterations, the size, and population to LSystem
  myLSystemHighway.createLSystem(3.0, 3.0, 0.4);
  let gridInfo: number[][] = grid.createGrid(myLSystemHighway.edgeArray);
  // VBO data for instance roads
  let vboData: any = myLSystemHighway.makeVBOs();
  square.setInstanceVBOsFullTransform(vboData.c1, vboData.c2, vboData.c3, vboData.c4, vboData.colors);
  square.setNumInstances(vboData.c1.length / 4.0); // 4 inputs per instance
  // VBO data for instanced buildings
  let buildings: any = grid.getVBOData();
  myCube.setInstanceVBOs(buildings.c1, buildings.c2, buildings.c3, buildings.c4, buildings.colors);
  myCube.setNumInstances(buildings.c1.length / 4.0); // 4 inputs per instance
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'Show Elevation');  
  gui.add(controls, 'Show Population Density');
  gui.add(controls, 'Show Buildings');
 
  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 150), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST)
  gl.blendFunc(gl.ONE, gl.ONE);

  // ALL SHADERS GO HERE
  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  const elevation = new ShaderProgram([    
    new Shader(gl.VERTEX_SHADER, require('./shaders/groundPlane-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/elevation-frag.glsl')),
  ]);

  const population = new ShaderProgram([    
    new Shader(gl.VERTEX_SHADER, require('./shaders/groundPlane-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/population-frag.glsl')),
  ]);

  const both = new ShaderProgram([    
    new Shader(gl.VERTEX_SHADER, require('./shaders/groundPlane-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/both-frag.glsl')),
  ]); 

  const textureShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/texture-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/texture-frag.glsl')),
  ]);

  const groundPlaneShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/groundPlane-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/groundPlane-frag.glsl')),
  ]); 

  const buildingShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/building-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/building-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    //console.log(camera);
    stats.begin();

    if (update === true) {
      update = false;
      startLSys(); // begin the LSystem when project is loaded up
    }

    instancedShader.setTime(time);
    buildingShader.setTime(time++); // for procedural day/night timing
    flat.setTime(time++); // for procedural day/night timing
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

     // if elevation box is checked, display terrain elevation map
     if(controls["Show Elevation"] && controls["Show Population Density"] == false){      
      renderer.render(camera, elevation, [groundPlane]); // groundPlane
    }
    // if population density box is checked, display population density map
    if(controls["Show Population Density"] && controls["Show Elevation"] == false){      
      renderer.render(camera, population, [groundPlane]); // groundPlane
    }
    // if neither box is checked, display plain land and water set up
    if(controls["Show Elevation"] == false && controls["Show Population Density"] == false){
      renderer.render(camera, groundPlaneShader, [groundPlane]); // groundPlane      
    }
    // if both are checked, display both maps
    if(controls["Show Elevation"] && controls["Show Population Density"]){      
      renderer.render(camera, both, [groundPlane]);
    }
    if(controls["Show Buildings"]){
      renderer.render(camera, buildingShader, [myCube]); // draw buildings
    }

    renderer.render(camera, flat, [screenQuad]); // This is now the procedural sky, always render    
    renderer.render(camera, instancedShader, [square]); // roads    
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  const texturecanvas = <HTMLCanvasElement> document.getElementById('texturecanvas');
  const textureRenderer = new OpenGLRenderer(texturecanvas);

  // texture in dimensions 2000x2000
  const width = 2000;
  const height = 2000;
  // texture creation
  textureRenderer.setSize(width, height);
  textureRenderer.setClearColor(0, 0, 1, 1);
  // texture needed for LSystem and grid
  let textureData: Uint8Array = textureRenderer.renderTexture(camera, textureShader, [screenQuad]);
  myLSystemHighway = new LSystemHighway(textureData);
  grid = new Grid(textureData);
 
  // Start the render loop
  tick();
}

main();