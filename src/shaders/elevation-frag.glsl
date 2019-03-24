#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time; 
uniform float u_Slider;

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

vec3 getTerrainElevation(vec2 inPos) {
	float water = getWater(inPos);
	vec2 pos = inPos - vec2(1.0, 0.5);
	float noiseTerm = fbm(pos / 2.0);
	noiseTerm = clamp((noiseTerm - 0.2), 0.0, 1.0);
  if(water == 1.0){
    // water
    return vec3(0.0863, 0.2902, 0.9608);
  }
  else{
    // land
    return  vec3(0.3765, 0.7725, 0.1804) * vec3(0.0, (noiseTerm * 1.5 * u_Slider), 0.0);
  }		
}

void main() {
  // display final coloring	
  vec2 tempPos = vec2(fs_Pos.x, fs_Pos.y);
  vec3 color = getTerrainElevation(tempPos);
	out_Col = vec4(color, 1.0);
}