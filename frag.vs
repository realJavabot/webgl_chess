precision mediump float;

uniform sampler2D uChessTex;
uniform vec4 baseColor;
uniform vec4 hoverColor;

varying mat4 matrix;
varying vec3 vNormal;
varying highp vec2 vTextureCoord;
varying vec3 vPos;
varying float TexIndex;


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

    
    vec4 ambient;
    vec4 specular = vec4(vec3(1.,1.,1.) * .5 * pow(clamp(dot(reflect(normalize(vPos-vec3(20.,20.,20.)),vNormal),normalize(vPos - (matrix*vec4(0.,-20.,0.,1.)).xyz)), .0, 1.),5.), 1.);
    vec4 diffuse = vec4(clamp(dot(vec3(20.,20.,20.), vNormal), 0., 1.));

    if(int(TexIndex) == 0){ // board
        ambient = vec4(0.,0.,0.05,1.0) + vec4(texture2D(uChessTex, vTextureCoord).xyz * .1, 1.);
        diffuse *= texture2D(uChessTex, vTextureCoord) * .5;
    }
    if(int(TexIndex) == 1){ // white
        ambient = vec4(0) / 2.;
        diffuse *= vec4(.5,.5,.1,0.) * .75;
        specular *= .8;
        //diffuse += + vec4(vPos.zzz,0) / 20.;
    }
    if(int(TexIndex) == 2){ // black
        ambient = vec4(-.01,-.01,-.01,1.0);
        diffuse *= vec4(0.02,0.02,0.02,0);
    }
    
    gl_FragColor = ambient + diffuse + specular;
}