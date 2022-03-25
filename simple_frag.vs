precision highp float;
uniform sampler2D buff;
varying highp vec2 vTextureCoord;

void main(void) {
    gl_FragColor = texture2D(buff, vTextureCoord);
}