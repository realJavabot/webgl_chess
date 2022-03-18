precision highp float;

uniform vec4 baseColor;

varying highp vec2 vTextureCoord;
varying vec2 vPos;

void main(void) {
    gl_FragColor = baseColor;
}