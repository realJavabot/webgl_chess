precision highp float;

attribute vec2 position;

varying highp vec2 vTextureCoord;
varying vec2 vPos;

void main(void) {
    gl_Position = vec4(position,0,1);
    vTextureCoord = position;
}