#version 300 es
precision highp float;

in vec4 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_Col;

out vec4 out_Col;

void main() {
    //out_Col = fs_Col;
    //vec3 color = vec3(0.2471, 0.2353, 0.2353); //gray
    vec3 color = vec3(0.4392, 0.3725, 0.1922);
    out_Col = vec4(color, 1.0);
}