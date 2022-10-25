precision highp float;
uniform sampler2D buffer;
varying highp vec2 vTextureCoord;

void main(void) {
    gl_FragColor = texture2D(buffer, vTextureCoord + vec2(1.,1.));
}