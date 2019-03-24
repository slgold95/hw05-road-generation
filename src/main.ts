import {vec3, mat3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import MySquare from './geometry/MySquare'; // Added for HW5
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import ExpansionRules from './LSystem/ExpansionRules'; // for LSystem
import LSystem from './LSystem/LSystem'; // for LSystem
import LSystemHighway from './LSystem/LSystemHighway'; // new LSystem for highway

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  // Added GUI controls for HW5
  'Show Elevation' : false, 
  'Show Population Density': false,  
  'Change Elevation': 1.0,
  'Change Density': 1.0,
  'Highway Angle': 1.0,
};

let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;
// HW 5 ROADS -----------------------
let tempVar: number; 
tempVar = 45.0;
let roadSystem: MySquare;
let highway: LSystemHighway;

let guiElevation: number = 1.0;
let guiPopDensity: number = 1.0;
let guiAngle: number = 1.0;

function makeLSystemHighway(guiAngle: number) {  
  highway.createLSystem(guiAngle);

  // Instance Render the street data
  let vboData: any = highway.makeVBOs();
  roadSystem.setInstanceVBOs(vboData.c1, vboData.c2, vboData.c3, vboData.c4, vboData.colors);
  roadSystem.setNumInstances(vboData.c1.length / 4.0);
}

// ADDED FOR HW5
let elevationQuad: ScreenQuad; // for the terrain elevation map to be displayed on
let popQuad: ScreenQuad; // to display the population density map

function loadScene() {
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();

  // ADDED FOR HW5
  // elevationQuad = new ScreenQuad();
  // elevationQuad.create();
  // popQuad = new ScreenQuad();
  // popQuad.create();  

  // CREATE THE ROAD SYSTEM
  roadSystem = new MySquare();
  roadSystem.create();
  

  // Set up instanced rendering data arrays here.
  // This example creates a set of positional
  // offsets and gradiated colors for a 100x100 grid
  // of squares, even though the VBO data for just
  // one square is actually passed to the GPU
  
  let offsetsArray = [];
  let colorsArray = [];
  let n: number = 100.0;
  for(let i = 0; i < n; i++) {
    for(let j = 0; j < n; j++) {
      offsetsArray.push(i);
      offsetsArray.push(j);
      offsetsArray.push(0);

      colorsArray.push(i / n);
      colorsArray.push(j / n);
      colorsArray.push(1.0);
      colorsArray.push(1.0); // Alpha channel
    }
  }
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  square.setInstanceVBOs(offsets, colors);
  square.setNumInstances(n * n); // grid of "particles" 
    
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
  // ADDED FOR HW5
  gui.add(controls, 'Show Elevation');  
  gui.add(controls, 'Show Population Density');
  gui.add(controls, 'Change Elevation', 1.0, 1.5).step(0.1);
  gui.add(controls, 'Change Density', 1.0, 5.0).step(1.0);
  gui.add(controls, 'Highway Angle', 1.0, 20.0).step(5.0);
 
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
  const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(50, 50, 0));
  
  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST) // want the roads and highways ontop of the maps
  //gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  // ADDED FOR HW5
  const elevation = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/elevation-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/elevation-frag.glsl')),
  ]);

  const population = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/population-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/population-frag.glsl')),
  ]);

  const both = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/both-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/both-frag.glsl')),
  ]); 

  const textureShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/texture-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/texture-frag.glsl')),
  ]);

  // Texture Renderer 
  const texturecanvas = <HTMLCanvasElement> document.getElementById('texturecanvas');
  const textureRenderer = new OpenGLRenderer(texturecanvas);

  // width and height for texture - Lsystem resolution
  const width = 2000; //window.innerWidth;
  const height = 2000; //window.innerHeight;
  textureRenderer.setSize(width, height);
  let textureData: Uint8Array = textureRenderer.renderTexture(camera, textureShader, [screenQuad]);
  //console.log(textureData);
  // create highways with the texture data
  highway = new LSystemHighway(textureData);
  makeLSystemHighway(guiAngle);  
     
  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);    
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    // check if Gui values have changed
    if(controls["Change Elevation"] - guiElevation != 0){
      guiElevation = controls["Change Elevation"];
      makeLSystemHighway(guiAngle);
    }
    if(controls["Change Density"] - guiPopDensity != 0){
      guiPopDensity = controls["Change Density"];
      makeLSystemHighway(guiAngle);
    }
    if(controls["Highway Angle"] - guiAngle != 0){
      guiAngle = controls["Highway Angle"];
      makeLSystemHighway(guiAngle);
    }

    renderer.clear();
    // ADDED FOR HW5
    //renderer.render(camera, flat, [screenQuad]);

    // pass in the value from the shader to change the population density through u_Time since its already here
    population.setTime(controls["Change Density"]);
    both.setTime(controls["Change Density"]);
    textureShader.setTime(controls["Change Density"]);
    elevation.setSlider(controls["Change Elevation"]);
    both.setSlider(controls["Change Elevation"]);
    textureShader.setSlider(controls["Change Elevation"]);

    // if elevation box is checked, display terrain elevation map
    if(controls["Show Elevation"] && controls["Show Population Density"] == false){
      renderer.render(camera, elevation, [screenQuad]);
    }
    // if population density box is checked, display population density map
    if(controls["Show Population Density"] && controls["Show Elevation"] == false){
      renderer.render(camera, population, [screenQuad]);
    }
    // if neither box is checked, display plain land and water set up
    if(controls["Show Elevation"] == false && controls["Show Population Density"] == false){
      renderer.render(camera, flat, [screenQuad]); // basic land and water view
      //renderer.render(camera, textureShader, [screenQuad]); // testing the noise values
    }
    // if both are checked, display both maps
    if(controls["Show Elevation"] && controls["Show Population Density"]){
      renderer.render(camera, both, [screenQuad]);
    }
    
    renderer.render(camera, instancedShader, [
      square,
      roadSystem,
    ]);
    //console.log("instanced shader used");
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

  // Start the render loop
  tick();
}

main();
