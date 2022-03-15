import * as vecMath from './math.mjs';

export default class transformObject{
    constructor(x=0, y=0, z=0, s=1){
        this.update = false;
        this.pos = [0,0,0];
        this.scaleF = [1,1,1];
        this.rotationMat = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
        this.transform = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
        this.translate(x,y,z);
        this.scale(s);
    }
    translate(x,y,z){
        this.pos[0] += x;
        this.pos[1] += y;
        this.pos[2] += z;
        this.transform.splice(12,3,...this.pos);
        this.update = true;
     }
     setTranslation(x,y,z){
       this.pos[0] = x;
       this.pos[1] = y;
       this.pos[2] = z;
       this.transform.splice(12,3,...this.pos);
       this.update = true;
    }
     rotate(x,y,z){
        const mat = this.transform.slice(0,12);
        vecMath.rotateX(mat, x); vecMath.rotateX(this.rotationMat, x);
        vecMath.rotateY(mat, y); vecMath.rotateY(this.rotationMat, y);
        vecMath.rotateZ(mat, z); vecMath.rotateZ(this.rotationMat, z);
        this.transform.splice(0,12,...mat);
        this.update = true;
     }

     rotateX(x){
        const mat = this.transform.slice(0,12);
        vecMath.rotateX(mat, x); vecMath.rotateX(this.rotationMat, -x);
        this.transform.splice(0,12,...mat);
        this.update = true;
     }

     rotateY(y){
        const mat = this.transform.slice(0,12);
        vecMath.rotateY(mat, y); vecMath.rotateY(this.rotationMat, -y);
        this.transform.splice(0,12,...mat);
        this.update = true;
     }

     rotateZ(z){
        const mat = this.transform.slice(0,12);
        vecMath.rotateZ(mat, z); vecMath.rotateZ(this.rotationMat, -z);
        this.transform.splice(0,12,...mat);
        this.update = true;
     }

     setRotation(x,y,z){
        const mat = [this.scaleF[0],0,0,0, 0,this.scaleF[1],0,0, 0,0,this.scaleF[2],0, 0,0,0,1];
        vecMath.rotateX(mat, x); vecMath.rotateX(this.rotationMat, x);
        vecMath.rotateY(mat, y); vecMath.rotateY(this.rotationMat, y);
        vecMath.rotateZ(mat, z); vecMath.rotateZ(this.rotationMat, z);
        this.transform.splice(0,12,...mat.slice(0,12));
        this.update = true;
     }
     setTransform(mat){
        this.transform = mat;
        this.pos = vecMath.getTranslation(mat);
        this.scaleF = vecMath.multScalar([mat[0], mat[5], mat[10]], 3/vecMath.length([1,1,1]));
        this.rotationMat = [...mat.slice(0,12), 0,0,0,1];
        this.update = true;
     }
     scale(x,y=x,z=x){
        this.scaleF[0] *= x;
        this.scaleF[1] *= y;
        this.scaleF[2] *= z;
        vecMath.scaleMat(this.transform, ...this.scaleF);
        this.update = true;
     }
}