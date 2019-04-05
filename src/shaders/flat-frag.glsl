#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform mat4 u_ViewProj;

in vec2 fs_Pos;
out vec4 out_Col;

const float PI = 3.14159265359;
const float TWO_PI = 6.28318530718;
const float m = 1.0; // multiplier to shrink the sky in y

// Sunset palette
const vec3 afternoon[5] = vec3[](vec3(255, 229, 119) / 255.0,
vec3(254, 192, 81) / 255.0,
vec3(255, 137, 103) / 255.0,
vec3(253, 96, 81) / 255.0,
vec3(57, 32, 51) / 255.0);

// early bright colors for sky
const vec3 sunset[5] = vec3[](vec3(248, 231, 223) / 255.0,
vec3(244, 218, 227) / 255.0,
vec3(221, 195, 224) / 255.0,
vec3(188, 213, 243) / 255.0,
vec3(212, 224, 250) / 255.0);

// red sky
const vec3 dusk[5] = vec3[](vec3(255, 193, 0) / 255.0,
vec3(255, 154, 0) / 255.0,
vec3(255, 116, 0) / 255.0,
vec3(255, 77, 0) / 255.0,
vec3(255, 0, 0) / 255.0);

const vec3 sunColor = vec3(255, 255, 190) / 255.0; // color of the sun
const vec3 cloudColor = sunset[3]; // cloud color

// a function that returns a position on the sphere (sky quad)
vec2 sphereToUV(vec3 p)
{
    float phi = atan(p.z, p.x); // Returns atan(z/x), phi is an angle
    if(phi < 0.0)// if phi is negative
    {
        phi += TWO_PI; // [0, TWO_PI] range now
    }
    // ^^ Could also just add PI to phi, but this shifts where the UV loop from X = 1 to Z = -1.
    float theta = acos(p.y); // [0, PI], theta is another angle
    //return 1 - (angle/ 2PI) which gives a position on the sphere
    return vec2(1.0 - phi / TWO_PI, 1.0 - theta / PI);
}

// returns specfic colors for dusk/early morning gradient
vec3 uvToSunset(vec2 uv)
{
    // Below horizon
    if(uv.y < 0.5 - m)
    {
        return sunset[0];
    }
    else if(uv.y < 0.55 - m) // 0.5 to 0.55
    {
        return mix(sunset[0], sunset[1], (uv.y - 0.5) / 0.05);
    }
    else if(uv.y < 0.6 - m)// 0.55 to 0.6
    {
        return mix(sunset[1], sunset[2], (uv.y - 0.55) / 0.05);
    }
    else if(uv.y < 0.65 - m) // 0.6 to 0.65
    {
        return mix(sunset[2], sunset[3], (uv.y - 0.6) / 0.05);
    }
    else if(uv.y < 0.75 - m) // 0.65 to 0.75
    {
        return mix(sunset[3], sunset[4], (uv.y - 0.65) / 0.1);
    }
    return sunset[4]; // 0.75 to 1
}

//-----------------------------------------------------------------------
// returns an orange sunset sky gradient
// new function based on demo code to give a third color gradient
vec3 uvToSunset2(vec2 uv)
{
    // Below horizon
    if(uv.y < 0.5 - m)
    {
        return afternoon[0];
    }
    else if(uv.y < 0.55 - m) // 0.5 to 0.55
    {
        return mix(afternoon[0], afternoon[1], (uv.y - 0.5) / 0.05);
    }
    else if(uv.y < 0.6 - m)// 0.55 to 0.6
    {
        return mix(afternoon[1], afternoon[2], (uv.y - 0.55) / 0.05);
    }
    else if(uv.y < 0.65 - m) // 0.6 to 0.65
    {
        return mix(afternoon[2], afternoon[3], (uv.y - 0.6) / 0.05);
    }
    else if(uv.y < 0.75 - m) // 0.65 to 0.75
    {
        return mix(afternoon[3], afternoon[4], (uv.y - 0.65) / 0.1);
    }
    return afternoon[4]; // 0.75 to 1
}
//--------------------------------------------------------------

// returns specfic colors for Dusk given the range of the uv
vec3 uvToDusk(vec2 uv)
{
    // Below horizon
    if(uv.y < 0.5 * m)
    {
        return dusk[0];
    }
    else if(uv.y < 0.55 - m) // 0.5 to 0.55
    {
        return mix(dusk[0], dusk[1], (uv.y - 0.5) / 0.05);
    }
    else if(uv.y < 0.6 - m)// 0.55 to 0.6
    {
        return mix(dusk[1], dusk[2], (uv.y - 0.55) / 0.05);
    }
    else if(uv.y < 0.65 - m) // 0.6 to 0.65
    {
        return mix(dusk[2], dusk[3], (uv.y - 0.6) / 0.05);
    }
    else if(uv.y < 0.75 - m) // 0.65 to 0.75
    {
        return mix(dusk[3], dusk[4], (uv.y - 0.65) / 0.1);
    }
    return dusk[4]; // 0.75 to 1
}

// a function to smooth the value of the uv, makes blending look better
vec2 smoothF(vec2 uv)
{
    return uv*uv*(3.-2.*uv); // make the uv values less intense
}

// a function for noise
float noise(in vec2 uv)
{
    const float k = 257.;
    vec4 l  = vec4(floor(uv),fract(uv));
    float u = l.x + l.y * k;
    vec4 v  = vec4(u, u+1.,u+k, u+k+1.);
    v       = fract(fract(1.23456789*v)*v/.987654321);
    l.zw    = smoothF(l.zw);
    l.x     = mix(v.x, v.y, l.z);
    l.y     = mix(v.z, v.w, l.z);
    return    mix(l.x, l.y, l.w);
}

// fractal brownian motion noise function
float fbm(const in vec2 uv)
{
    float a = 0.5;
    float f = 5.0;
    float n = 0.;
    int it = 15;
    for(int i = 0; i < 44; i++)
    {
        if(i<it)
        {
            n += noise(uv*f)*a;
            a *= .5;
            f *= 2.;
        }
    }
    return n;
}

void main() {
   // convert the fragments position into ndc space by dividing by the dimensions of the screen
    // then multiply by 2 and subtract 1
    vec2 ndc = (gl_FragCoord.xy/ vec2(u_Dimensions)) * 2.0 - 1.0;
    // pixel (we want at the far clip plane)
    vec4 p = vec4(ndc.xy, 1, 1);
    // inverse of viewProj set on the cpu as u_ViewProj
    // so here we can just mulitply u_ViewProj * p to go
    // from unhomogenized screen space to world, have to reunhomogenze p. Undo the perspective divide
    p = u_ViewProj * p;

    // the ray Dir is the normalized vector from the pixel to the camera (u_EyeVec3)
    // cast a ray from the camera to the pixel
    vec3 rayDir = normalize(p.xyz - u_Eye);

    // pass in the rayDir to get a spot on the sphere(quad sky) from a given vector
    vec2 uv = sphereToUV(rayDir);

    // sets the color in a gradient according to a palette defined above
    vec3 skyHue = uvToSunset(uv);

//------------------------------------------------------------------------------------------------
    float x = sin(float(u_Time*.0085));// an oscilating value for day/night cycle

    // use a fbm to generate a "random" hieght field value
    float heightField = fbm(uv + vec2(float(u_Time * 0.001)));

    // get the slope of the fbm at given uv spot, to make the sky color distribution less uniform
    vec2 slope = vec2(fbm(uv + vec2(1.0/u_Dimensions.x * 5.0,0)) - fbm(uv - vec2(1.0/u_Dimensions.x, 0.0)),
                      fbm(uv + vec2(0.0,1.0/u_Dimensions.y * 5.0)) - fbm(uv - vec2(0.0, 1.0/u_Dimensions.y)));

    // get a noisier gradient for sky color
    vec3 distortedSkyHue = uvToSunset(uv + slope);

    // make that color as a vec4 with no transparency (1) in the alpha channel
    vec4 color = vec4(distortedSkyHue, 1.0);

    // day/night cycle

    // night sky color gradient returned from the uvToDusk function
    vec3 distNight = vec3(uvToDusk(uv+slope));
    // sunset color gradient returned from the uvToSunset2 function
    vec3 distSunset = vec3(uvToSunset2(uv+slope));

    //if x between [-1, 0) do dusk->sunset
    if (sign(x) < 0.0 )
    {
        // interpolate between dusk and sunset
        // 1-x to offset the negative
        out_Col = vec4(mix(distSunset,color.rgb, 1.0-x ),1.0);
    }
    //if x between [0, 1] do sunset -> night
    else if(sign(x)>= 0.0)
    {  
        // interpolate between sunset and night
        out_Col = vec4(mix(color.rgb, distNight, x),1.0);
    }
} // closes main
