#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time; 

in vec2 fs_Pos;
out vec4 out_Col;

vec2 smoothF(vec2 uv) {
    return uv * uv * (3.0 - 2.0 * uv);
}

float noise(vec2 uv) {
    const float k = 250.0;
    vec4 l  = vec4(floor(uv), fract(uv));
    float u = l.x + l.y * k;
    vec4 v = vec4(u, u + 1.0, u + k, u + k + 1.0);
    v = fract(fract(1.23456789 * v) * v / 0.987654321);
    l.zw = smoothF(l.zw);
    l.x = mix(v.x, v.y, l.z);
    l.y = mix(v.z, v.w, l.z);
    return mix(l.x, l.y, l.w);
}

// based on lecture slides and Book of Shaders
float fbm (in vec2 st) {
    // Initial values
    float total = 0.0;
    float frequency = 5.0;
    float amp = 0.5;
    int octaves = 8;
    
    // Loop for number of octaves
    for (int i = 0; i < octaves; i++) {
          total +=  noise(vec2(st.x * frequency, st.y * frequency)) * amp;  
          frequency *= 2.0;
          amp = amp/2.0;     
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

float inWater(vec2 uv) {
  vec2 offset = vec2(-1.1, -0.4);	
  vec2 pos = uv + offset;
	float fbm = fbm(pos / 2.0);
  fbm -= (0.4 - 0.022);
  fbm /= .622;
  fbm = clamp(fbm, 0.0, 1.0);	
  if(fbm == 0.0){
    return 1.0;
  }
  else{
    return 0.0;
  }	
}

vec3 populationMap(vec2 uv) {
  vec2 offset = vec2(0.02, 0.0);
	float water = inWater(uv);
	vec2 pos = uv + offset;
	float noiseTerm = worleyNoise(pos.x, pos.y, 150.0, 150.0);
  if(water == 1.0){
    return vec3(0.0863, 0.2902, 0.9608);
  }
  else{
    return vec3(0.3765, 0.7725, 0.1804) * vec3(0.0, 1.0 - (noiseTerm /* * u_Time*/), 0.0);
  }	
}

void main() {
  // display final coloring	
  vec2 tempPos = vec2(fs_Pos.x, fs_Pos.y);
  float xPos = (fs_Pos.x + 1.0) / 2.0;
	float yPos = (fs_Pos.y + 1.0) / 2.0;
  float remapX = mix(-0.15, 0.35, xPos);
	float remapY = mix(0.057, 0.557, yPos);
  vec3 color = populationMap(vec2(remapX, remapY));
	out_Col = vec4(color, 1.0);
}