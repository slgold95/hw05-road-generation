#version 300 es
precision highp float;

uniform float u_Time;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec4 fs_Nor;
in float fs_Height;

out vec4 out_Col;

vec3 windows(vec2 uv, vec3 color) {
    float w = 15.85;
    float h = 15.2;
    float windowW = 3.55* 2.0;
    float windowH = 1.70* 2.0;
    float x = uv.x - w * floor(uv.x / w);
    float y = uv.y - h * floor(uv.y / h);
    float t = sin(u_Time * 0.0085);
    t = t + (fs_Height/ 4.0);   
    if ((x > (w - windowW) * 0.5) && (x < (w + windowW) * 0.5) && (y > (h - windowH) * 0.5) && (y < (h + windowH) * 0.5)){    
        return mix(vec3(0.851, 0.8667, 0.0), vec3(0.4941, 0.4824, 0.4824) , 1.0- t);
    }
    else {
        return color;
    }
}

vec3 lowBuildings(vec2 uv, vec3 color) {
    float w = 95.1;
    float h = 30.4;
    float windowW = 21.3;
    float windowH = 10.2;
    float x = uv.x - w * floor(uv.x / w);
    x /= 2.0;
    float y = uv.y - h * floor(uv.y / h);
    y /= 2.0;
    float t = sin(u_Time * 0.0085);
    t = t + (fs_Height/ 4.0);   
    if ((x > (w - windowW) * 0.5) && (x < (w + windowW) * 0.5) && (y > (h - windowH) * 0.5) && (y < (h + windowH) * 0.5)){    
        return mix(vec3(0.8667, 0.6353, 0.0), vec3(0.4941, 0.4824, 0.4824) , 1.0- t);
    }
    else {
        return color;
    }
}

vec3 skyScraper(vec2 uv, vec3 color) {
    float w = 20.0;
    float h = 10.0;
    float windowW = 20.0;
    float windowH = 3.5;
    float x = uv.x - w * floor(uv.x / w);
    float y = uv.y - h * floor(uv.y / h);
    float t = sin(u_Time * 0.0085);
    t = t + (fs_Height/ 4.0);
    // color the pixels within range for the window space
    if ((x > (w - windowW) * 0.5) && (x < (w + windowW) * 0.5) && (y > (h - windowH) * 0.5) && (y < (h + windowH) * 0.5)){
      //          window light on           // window light off
        return mix(vec3(0.851, 0.8667, 0.0), vec3(0.4941, 0.4824, 0.4824) , 1.0- t);
    }
    else {
        return color;
    }
}

void main()
{
  float t = sin(u_Time * 0.0085);
 // lambertian shading
 // medium buildings
  vec3 buildingColAfternoon = mix(vec3(0.4784, 0.3294, 0.1922),vec3(1.0, 0.0, 0.0), fs_Pos.y);     
  vec3 buildingColMorning = mix(vec3(0.4784, 0.3294, 0.1922),vec3(0.3098, 0.5922, 0.6784), fs_Pos.y);
  vec3 buildingCol = mix(buildingColMorning, buildingColAfternoon, t);                             
  vec3 diffuse = vec3(1.56, 1.00, 1.0) * min(max(dot(fs_Nor, vec4(0.0, 1.0, 0.0, 1.0)), 0.0) + 0.2, 1.0);
  vec3 other = vec3(0.26, 0.50, 0.4) * min(max(fs_Nor.y, 0.0) + 0.2, 1.0);
  vec3 lightingColor = pow((diffuse + other) * buildingCol, vec3(1.0 / 2.2));
 // skyscrapers
  vec3 skyscraperColAfternoon = mix(vec3(0.4196, 0.3137, 0.2353),vec3(0.6392, 0.2078, 0.2078), fs_Pos.y);     
  vec3 skyscraperColMorning = mix(vec3(0.3255, 0.2784, 0.2392),vec3(0.3098, 0.5922, 0.6784), fs_Pos.y);
  vec3 skyscraperCol = mix(skyscraperColMorning, skyscraperColAfternoon, t);     
  vec3 lightingColorSkyscraper = pow((diffuse + other) * skyscraperCol, vec3(1.0 / 2.2));
  // low buildings
  vec3 lowColAfternoon = mix(vec3(0.7059, 0.7255, 0.4039),vec3(0.6392, 0.2078, 0.2078), fs_Pos.y);     
  vec3 lowColMorning = mix(vec3(0.4941, 0.349, 0.2275),vec3(0.3098, 0.5922, 0.6784), fs_Pos.y);
  vec3 lowCol = mix(lowColMorning, lowColAfternoon, t);     
  vec3 lightingColorLow = pow((diffuse + other) * lowCol, vec3(1.0 / 2.2));
  
  vec3 temp; 
  // medium builinds
  temp = windows(vec2(fs_Pos.x * 100.0, fs_Pos.y * 100.0), lightingColor);
  temp = clamp(vec3(temp * lightingColor), 0.0, 1.0);
  out_Col = vec4(temp, 1.0);
  // low buildings 
  if(fs_Height < 0.70){
    temp = lowBuildings(vec2(fs_Pos.x * 100.0, fs_Pos.y * 100.0), lightingColorLow);
    temp = clamp(vec3(temp * lightingColorLow), 0.0, 1.0);
    out_Col = vec4(temp, 1.0);   
  }
  if(fs_Height > 3.0){
    temp = skyScraper(vec2(fs_Pos.x * 100.0, fs_Pos.y * 100.0), lightingColorSkyscraper);
    temp = clamp(vec3(temp * lightingColorSkyscraper), 0.0, 1.0);
    out_Col = vec4(temp, 1.0);   
  }
}