let tweens = [];

class Tween{
    constructor(length){
        this.length = length;
        this.value = 0;
        this.paused = false;
        this.maxlength = length;
        this.percent = 0;
        this.previousTime = Date.now();
        tweens.push(this);
    }

    update(){
        if(this.paused){return;}
        const newTime = Date.now();
        this.value += (newTime - this.previousTime)/10000;
        this.previousTime = newTime;
        this.percent = this.value / this.maxlength;
        if(this.value >= this.length){
            this.paused = true;
        }
    }

    delete(){
        tweens.splice(tweens.indexOf(this),1);
    }

    reset(){
        this.value = this.percent = 0;
        this.paused = false;
        this.previousTime = Date.now();
    }
}

class Path{
    constructor(startx, starty, endx, endy){
        this.start = [startx, starty];
        this.end = [endx, endy];
    }

    at(percent){
        return smoothInterp2D(...this.start, ...this.end, percent);
    }
}

// cubic bezier in 3d
// https://pomax.github.io/bezierinfo/
class Bezier{
    constructor(points){
        this.points = [];
        for(let i=0; i<points.length; i+=3){
            this.points.push(points.slice(i,i+3));
        }
        if(this.points.length != 4){
            console.log("not enough points!");
            this.points = [];
        }else{
            this.end = this.points[this.points.length-1];
        }
    }

    at(percent){
        const p1 = lerp3D(...this.points[0], ...this.points[1], percent);
        const p2 = lerp3D(...p1, ...this.points[2], percent);
        return( lerp3D(...p2, ...this.points[3], percent) );
    }
}