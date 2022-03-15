export { dot, cross, add, sub, lengthSquared, length, multScalar, 
   project, normalize, rotateX, rotateY, rotateZ, rotateVec, 
   translate, getTranslation, getRotation, scaleMat, multMat, isPowerOf2, 
   get_projection, inverse_projection, lerp, smoothInterp, smoothInterp2D,
   lerp2D, lerp3D, same2D, same3D
};

function dot(v1, v2){
   return v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
}

function cross(v1, v2){
   let ret = [0,0,0];
   ret[0] = v1[1]*v2[2] - v1[2]*v2[1];
   ret[1] = v1[2]*v2[0] - v1[0]*v2[2];
   ret[2] = v1[0]*v2[1] - v1[1]*v2[0];
   return ret;
}

function add(v1, v2){
   let ret = [0,0,0];
   ret[0] = v1[0] + v2[0];
   ret[1] = v1[1] + v2[1];
   ret[2] = v1[2] + v2[2];
   if(!ret[2]){return ret.slice(0,2);}
   return ret;
}

function sub(v1, v2){
   let ret = [0,0,0];
   ret[0] = v1[0] - v2[0];
   ret[1] = v1[1] - v2[1];
   ret[2] = v1[2] - v2[2];
   return ret;
}

function lengthSquared(v){
   return v[0]*v[0] + v[1]*v[1] + v[2]*v[2];
}

function length(v){
   return Math.sqrt(lengthSquared(v));
}

function multScalar(v, s){
   return v.map(e=>{return e*s;});
}  

function project(v1,v2){
   let len = dot(v1,v2);   //project v1 onto v2
   len /= length(v2);
   const dir = normalize(v2);
   return multScalar(dir,len);
}

function normalize(v){
   const len = length(v);
   return v.map(e=>{ return e/len; });
}

function rotateZ(m, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const mv0 = m[0], mv4 = m[4], mv8 = m[8];

    m[0] = c*m[0]-s*m[1];
    m[4] = c*m[4]-s*m[5];
    m[8] = c*m[8]-s*m[9];

    m[1]=c*m[1]+s*mv0;
    m[5]=c*m[5]+s*mv4;
    m[9]=c*m[9]+s*mv8;
 }

 function rotateX(m, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const mv1 = m[1], mv5 = m[5], mv9 = m[9];

    m[1] = m[1]*c-m[2]*s;
    m[5] = m[5]*c-m[6]*s;
    m[9] = m[9]*c-m[10]*s;

    m[2] = m[2]*c+mv1*s;
    m[6] = m[6]*c+mv5*s;
    m[10] = m[10]*c+mv9*s;
 }

 function rotateY(m, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const mv0 = m[0], mv4 = m[4], mv8 = m[8];

    m[0] = c*m[0]+s*m[2];
    m[4] = c*m[4]+s*m[6];
    m[8] = c*m[8]+s*m[10];

    m[2] = c*m[2]-s*mv0;
    m[6] = c*m[6]-s*mv4;
    m[10] = c*m[10]-s*mv8;
 }

 function rotateVec(v,angle){
    return [
       v[0] * Math.cos(angle) -   v[2] * Math.sin(angle),
       v[1],
       v[2] * Math.cos(angle) + v[0] * Math.sin(angle)
    ];
 }

 function translate(m, x, y, z){
    m[12] += x;
    m[13] += y;
    m[14] += z;
 }

 function getTranslation(m){
    return m.slice(12,15);
 }

 function getRotation(m,scalex, scaley, scalez){
    let mat = m.slice(0,12);
    mat[0] /= scalex;
    mat[5] /= scaley;
    mat[10] /= scalez;
    return [...mat, 0,0,0,1];
 }

function scaleMat(m, x, y, z){
   m[0] *= x;
   m[5] *= y;
   m[10] *= z;
}

function multMat(m, v){
   const v2 = [];
   v2[0] = m[0]*v[0] + m[4]*v[1] + m[8]*v[2] + m[12];
   v2[1] = m[1]*v[0] + m[5]*v[1] + m[9]*v[2] + m[13];
   v2[2] = m[2]*v[0] + m[6]*v[1] + m[10]*v[2] + m[14];
   return v2;
}

 function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
 }

 function get_projection(angle, a, zMin, zMax) {
    const ang = Math.tan((angle*.5)*Math.PI/180);//angle*.5
    return [
       0.5/ang, 0 , 0, 0,
       0, 0.5*a/ang, 0, 0,
       0, 0, -(zMax+zMin)/(zMax-zMin), -1,
       0, 0, (-2*zMax*zMin)/(zMax-zMin), 0 
    ];
 }

 function inverse_projection(angle, a, zMin, zMax, v){
   const ang = Math.tan((angle*.5)*Math.PI/180);//angle*.5
   return [
      2*ang, 0 , 0, 0,
      0, 2*ang/a, 0, 0,
      0, 0, (zMax-zMin)/-(zMax+zMin), -1,
      0, 0, (zMax-zMin)/(-2*zMax*zMin), 0 
   ];
 }

 function lerp(a, b, p){
    return a*(1-p) + b*p;
 }

 function smoothInterp(a, b, p){
   const bias = Math.sin(p*Math.PI/2);
   return a*(1-bias) + b*bias;
}

function smoothInterp2D(ax, ay, bx, by, p){
   return [smoothInterp(ax, bx, p), smoothInterp(ay, by, p)];
}

 function lerp2D(ax, ay, bx, by, p){
   return [lerp(ax, bx, p), lerp(ay, by, p)];
}

function lerp3D(ax, ay, az, bx, by, bz, p){
   return [lerp(ax, bx, p), lerp(ay, by, p), lerp(az, bz, p)];
}

function same2D(ax, ay, bx, by){
   return ax == bx && ay == by;
}

function same3D(ax, ay, az, bx, by, bz){
   return ax == bx && ay == by && az == bz;
}