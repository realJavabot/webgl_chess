uniform mat4 Pmatrix;
uniform mat4 Vmatrix;
uniform mat4 Mmatrix;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 texcoor;
attribute float textureindex;

varying mat4 matrix;
varying highp vec2 vTextureCoord;
varying vec3 vPos;
varying float TexIndex;
varying vec3 vNormal;

void main(void) {
    vec4 new_pos = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);
    gl_Position = new_pos;
    vPos = new_pos.xyz;
    vNormal = normal;
    vTextureCoord = texcoor;
    matrix = Mmatrix;
    TexIndex = textureindex;
}