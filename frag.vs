precision mediump float;

uniform sampler2D uChessTex;
uniform sampler2D uiTex;
uniform vec4 baseColor;
uniform vec4 hoverColor;
uniform float TexIndex;

varying mat4 matrix;
varying vec3 vNormal;
varying highp vec2 vTextureCoord;
varying vec3 vPos;


void main(void) {
    gl_FragColor = vec4(1,0,0,1);

    if(int(TexIndex) == 3){
        gl_FragColor = baseColor;
        return;
    }
    if(int(TexIndex) == 4){
        gl_FragColor = hoverColor;
        return;
    }

    // ui
    if(int(TexIndex) == 5){
        gl_FragColor = texture2D(uiTex, vTextureCoord);
        return;
    }
    
    vec3 ambient;
    vec3 specular = vec3(1.,1.,1.) * .5 * pow(clamp(dot(reflect(normalize(vPos-vec3(20.,20.,20.)),vNormal),normalize(vPos - (matrix*vec4(0.,-20.,0.,1.)).xyz)), .0, 1.),5.);
    vec3 diffuse = vec3(clamp(dot(vec3(20.,20.,20.), vNormal), 0., 1.));

    if(int(TexIndex) == 0){ // board
        ambient = vec3(0.,0.,0.05) + vec3(texture2D(uChessTex, vTextureCoord).xyz * .1);
        diffuse *= vec3(texture2D(uChessTex, vTextureCoord)) * .5;
    }
    if(int(TexIndex) == 1){ // white
        ambient = vec3(0) / 2.;
        diffuse *= vec3(.5,.5,.1) * .75;
        specular *= .8;
        //diffuse += + vec3(vPos.zzz,0) / 20.;
    }
    if(int(TexIndex) == 2){ // black
        ambient = vec3(-.01,-.01,-.01);
        diffuse *= vec3(0.02,0.02,0.02);
    }
    gl_FragColor = vec4(ambient + diffuse + specular,1.);

    // vec3 ambient = vec3(.1,.1,.1);
    // vec3 diffuse = vec3(dot(vNormal, vec3(10.,10.,10.))) * .1;
    // vec3 specular = vec3(0.,0.,0.);
    
    // gl_FragColor = vec4((ambient + diffuse + specular),1.);
}