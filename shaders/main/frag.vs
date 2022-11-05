precision mediump float;

uniform sampler2D uChessTex;
uniform vec4 baseColor;
uniform vec4 hoverColor;
uniform int TexIndex;

varying mat4 matrix;
varying vec3 vNormal;
varying highp vec2 vTextureCoord;
varying vec3 vPos;


void main(void) {
    gl_FragColor = vec4(1,0,0,1);

    if(TexIndex == 3){
        gl_FragColor = baseColor;
        return;
    }
    if(TexIndex == 4){
        gl_FragColor = hoverColor;
        return;
    }
    
    vec3 ambient;
    vec3 light = vec3(0.,10.,0.);
    vec3 specular = clamp(vec3(1.,1.,1.) * .5 
    * pow(
        dot(
            reflect(
                normalize(
                    vPos-light
                ),
                vNormal
            )/1.2,
            normalize(
                vPos - (matrix*vec4(0.,-20.,0.,1.)).xyz
            )
        ),
    5.), 0., 1.);
    vec3 diffuse = vec3(clamp(dot( light, vNormal), 0., 1.));
    vec3 shadows = vec3(clamp(pow(clamp(dot(-light, vNormal) / 15., 0., 10.),2.), 0., 10.));

    if(TexIndex == 0){ // board
        specular /= 3.;
        ambient = vec3(0.,0.,0.05) + vec3(texture2D(uChessTex, vTextureCoord).xyz * .1);
        diffuse *= vec3(texture2D(uChessTex, vTextureCoord)) * .7;
    }
    if(TexIndex == 1){ // white
        ambient = vec3(250.,219.,100.)/(255. *3.);
        diffuse *= vec3(.5,.5,.5);
        diffuse -= shadows*diffuse;
        specular *= .8;
    }
    if(TexIndex == 2){ // black
        ambient = vec3(-.01,-.01,-.01);
        diffuse *= vec3(0.1,0.1,0.1);
        diffuse -= shadows*diffuse;
        specular *= 1.3;
    }
    gl_FragColor = vec4(ambient + diffuse + specular,1.);

    // vec3 ambient = vec3(.1,.1,.1);
    // vec3 diffuse = vec3(dot(vNormal, vec3(10.,10.,10.))) * .1;
    // vec3 specular = vec3(0.,0.,0.);
    
    // gl_FragColor = vec4((ambient + diffuse + specular),1.);
}