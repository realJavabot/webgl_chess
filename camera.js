class Camera extends transformObject{
    constructor(xRotation,yRotation,radius){
       super();
       this.setOrbitRotation(xRotation,yRotation);
       this.setOrbitRadius(radius);
    }
    setOrbitRadius(newRadius){
       if(newRadius >= -5 || newRadius <= -30){return;}
       this.radius = newRadius;
       this.updateTransform();
    }
    setOrbitRotation(x, y){
       if(y > 1.8 || y < 0){return;}
       this.rotation = [x,y];
       this.updateTransform();
    }
    updateTransform(){
       this.setTranslation(0, 0, this.radius);
       this.setRotation(0,0,0);
       this.rotateY(this.rotation[0]);
       this.rotateX(this.rotation[1]);
    }
}