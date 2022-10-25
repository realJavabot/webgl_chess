precision highp float;

uniform mat3 Pmatrix;

attribute vec2 position;

varying highp vec2 vTextureCoord;
varying vec2 vPos;
varying float TexIndex;

void main(void) {
    vec3 new_pos = Pmatrix*vec3(position, 1.);
    gl_Position = vec4(new_pos,1);
    vPos = new_pos.xy;
}