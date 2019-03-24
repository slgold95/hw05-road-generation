#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time; 

in vec2 fs_Pos;
out vec4 out_Col;

// random, noise, and fbm from Book of Shaders
float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

// based on lecture slides and Book of Shaders
float fbm (in vec2 st) {
    // Initial values
    float total = 0.0;
    float persist = 0.5;
    int octaves = 8;
    
    // Loop for number of octaves
    for (int i = 0; i < octaves; i++) {
          float frequency = pow(2.5, float(i));
          float amp = pow(persist, float(i));
        total +=  noise(vec2(st.x * frequency, st.y * frequency)) * amp;       
    }
    return total;
}

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

float worleyNoise(float x, float y, float rows, float cols){
    float posX = x * cols / 20.0;
    float posY = y * rows / 20.0;
    float minDist = 50.0;

    for (float i = -1.0; i < 2.0; i++) {
        for (float j = -1.0; j < 2.0; j++) {
            vec2 grid = vec2(floor(posX) + i, floor(posY) + j);
            vec2 noiseTerm = grid + random2(grid + vec2(2.0, 0.0));
            float currDist = distance(vec2(posX, posY), noiseTerm);
            if (currDist <= minDist) {
                minDist = currDist;
            }
        }
    }
    return minDist;
}

float getWater(vec2 inPos) {
	vec2 pos = inPos - vec2(1.0, 0.5);
	float noiseTerm = fbm(pos / 2.0);
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

vec3 getPopulationDensity(vec2 inPos) {
	float water = getWater(inPos);
	vec2 pos = inPos - vec2(-0.02, 0);
	float noiseTerm = worleyNoise(pos.x, pos.y, 25.0, 25.0);
  if(water == 1.0){
    return vec3(0.0863, 0.2902, 0.9608);
  }
  else{
    return vec3(0.3765, 0.7725, 0.1804) * vec3(0.0, 1.0 - (noiseTerm * u_Time), 0.0);
  }	
}

void main() {
  // display final coloring	
  vec2 tempPos = vec2(fs_Pos.x, fs_Pos.y);
  vec3 color = getPopulationDensity(tempPos);
	out_Col = vec4(color, 1.0);
}