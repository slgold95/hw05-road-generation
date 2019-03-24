import {vec3, vec2, mat4, quat, glMatrix} from 'gl-matrix';

// random, noise, and fbm from Book of Shaders
export function random(st: vec2) : number {
    let temp1 = vec2.dot(st, vec2.fromValues(12.9898, 78.233));    

    let result: number = Math.sin(temp1); // sin 
    result = result * 43758.5453123;    
    result = result - Math.floor(result); // fract component

    return result;
}

export function mix(x: number, y: number, alpha: number): number{
// lerp
return (x * (1.0 - alpha)) + (y * alpha);
}

export function noise (st: vec2): number {   
    let i: vec2 = vec2.create();
    i = vec2.fromValues(Math.floor(st[0]), Math.floor(st[1])); // floor
    let f: vec2 = vec2.create();
    f = vec2.fromValues(st[0] - Math.floor(st[0]), st[1] - Math.floor(st[1])); // fract

    // Four corners in 2D of a tile    
    let a: number = random(i);
    let temp1: vec2 = vec2.create();
    vec2.add(temp1, i, vec2.fromValues(1.0, 0.0));
    let b: number = random(temp1);
    let temp2: vec2 = vec2.create();
    vec2.add(temp2, i, vec2.fromValues(0.0, 1.0));
    let c: number = random(temp2);
    let temp3: vec2 = vec2.create();
    vec2.add(temp3, i, vec2.fromValues(1.0, 1.0));
    let d: number = random(temp3);

    //vec2 u = f * f * (3.0 - 2.0 * f);
    let u: vec2 = vec2.create();
    let u1: number =  f[0] * f[0] * (3.0 - 2.0 * f[0]);
    let u2: number =  f[1] * f[1] * (3.0 - 2.0 * f[1]);
    u = vec2.fromValues(u1, u2);

    return mix(a, b, u[0]) +
            (c - a)* u[1] * (1.0 - u[0]) +
            (d - b) * u[0] * u[1];
}

// based on lecture slides and Book of Shaders
export function fbm (st: vec2): number {
    // Initial values
    let total: number = 0.0;
    let persist: number = 0.5;
    let octaves: number = 8;
    
    // Loop for number of octaves
    for (var i = 0.0; i < octaves; i++) {
          let frequency: number = Math.pow(2.5, i);
          let amp: number = Math.pow(persist, i);
        total +=  noise(vec2.fromValues(st[0] * frequency, st[1] * frequency)) * amp;       
    }
    return total;
}

// random func for Worley Noise
export function random2(p: vec2) : vec2 {
    let temp1 = vec2.dot(p, vec2.fromValues(127.1, 311.7));
    let temp2 = vec2.dot(p, vec2.fromValues(269.5, 183.3));

    let result: vec2 = vec2.fromValues(temp1, temp2);
    result = vec2.fromValues(Math.sin(result[0]) * 43758.545, Math.sin(result[1]) * 43758.545); //sin
    result = vec2.fromValues(result[0] - Math.floor(result[0]), result[1] - Math.floor(result[1])); // fract component

    return result;
}

export function worleyNoise(x : number, y: number, rows: number, cols: number) : number {
    let posX: number = x * cols / 20.0;
    let posY: number = y * rows / 20.0;
    let minDist: number = 50.0;

    for (var i = -1.0; i < 2.0; i++) {
        for (var j = -1.0; j < 2.0; j++) {
            let grid: vec2 = vec2.fromValues(Math.floor(posX) + i, Math.floor(posY) + j);
            let noiseVec: vec2 = vec2.create();
            vec2.add(grid,grid, vec2.fromValues(2.0, 0.0));
            vec2.add(noiseVec, grid, random2(grid));
            let currDist: number = vec2.distance(vec2.fromValues(posX, posY), noiseVec);
            if (currDist <= minDist) {
                minDist = currDist;               
            }
        }
    }

    return minDist;
}

export function clamp(input: number, min: number, max: number): number{
if(input <= min ){
 return min;
}
else if(input > max){
 return max;
}
}

// noise func to determine if in water or not
export function inWater(inPos: vec2): number {
    let pos: vec2 = vec2.create();
    vec2.add(pos, inPos, vec2.fromValues(-1.0, -0.5));      
    let noiseTerm: number = fbm(vec2.fromValues(pos[0]/2.0, pos[1]/2.0));
	noiseTerm = clamp((noiseTerm - 0.378) / 0.622, 0.0, 1.0);
  if(noiseTerm == 0.0){
    // water
    return 1.0;
  }
  else{
    // land
    return 0.0;
  }	
}

export function getTerrainElevation(inPos: vec2): number {
    let water: number = inWater(inPos);
    let pos: vec2 = vec2.create();
    vec2.add(pos, inPos, vec2.fromValues(-1.0, -0.5));  	
	let noiseTerm: number = fbm(vec2.fromValues(pos[0]/2.0, pos[1]/2.0));
	noiseTerm = clamp((noiseTerm - 0.2), 0.0, 1.0);
  if(water == 1.0){
    // water
    return 0.0;
  }
  else{
    // land
    return  noiseTerm;
  }		
}

export function getPopulationDensity(inPos: vec2): number {
    let water: number = inWater(inPos);
    let pos: vec2 = vec2.create();
    vec2.add(pos, inPos, vec2.fromValues(0.02, 0.0));  	
	let noiseTerm: number = worleyNoise(pos[0], pos[1], 50.0, 50.0);
  if(water == 1.0){
      // no population - in water
    return 0.0;
  }
  else{
      // population
    return noiseTerm;
  }	
}