import * as vecMath from './math.mjs';
export {geo, geos, loadGeometry};

const geos = {};

class geo{
    constructor(name){
       this.length = 0;
       this.vertices = [];
       this.texcoors = [];
       this.normals = [];
       this.indices = [];
       this.buffer = {};
       this.name = name;
       geos[name] = this;
    }
    getVerts(T){
       const ret = [];
       for(let i=0; i<this.vertices.length; i+=3){
          const v = this.vertices.slice(i,i+3);
          ret.push(...vecMath.multMat(T,v));
       }
       return ret;
    }
    getNormals(T){
      const ret = [];
      for(let i=0; i<this.normals.length; i+=3){
         const v = this.normals.slice(i,i+3);
         ret.push(...vecMath.multMat(T,v));
      }
      return ret;
   }
 }

 function loadGeometry(path, name){
    const tn = [];
    const tt = [];
    const ob = new geo(name);
    return fetch(path)
          .then(response => {return response.text();})
          .then(text => {
             return new Promise((resolve, reject)=>{
             text = text.split("\n");
             text.forEach(line=>{
                line = line.split(" ");
                if(line[0] == "v"){
                   ob.vertices.push(
                      parseFloat(line[1]),
                      parseFloat(line[2]),
                      parseFloat(line[3]));
                }
                if(line[0] == "vn"){
                   tn.push(
                      [parseFloat(line[1]),
                      parseFloat(line[2]),
                      parseFloat(line[3])]);
                }
                if(line[0] == "vt"){
                   tt.push(
                      [parseFloat(line[1]),
                      parseFloat(line[2])]);
                }
                if(line[0] == "f"){
                   line.splice(0,1);
                   const points = [];
                   line.forEach(group=>{
                      group = group.split("/");
                      const point = parseInt(group[0]) - 1;
                      points.push(point);
                      ob.normals[point*3] = tn[parseInt(group[2])-1][0];
                      ob.normals[point*3+1] = tn[parseInt(group[2])-1][1];
                      ob.normals[point*3+2] = tn[parseInt(group[2])-1][2];
                      ob.texcoors[point*2] = tt[parseInt(group[1])-1][0];
                      ob.texcoors[point*2+1] = tt[parseInt(group[1])-1][1];
                   });
                   ob.indices.push(points[0],points[1],points[2]);
                   if(points.length == 4){
                      ob.indices.push(points[0],points[2],points[3]);
                   }
                }
             });
             ob.length = ob.vertices.length;
             resolve(true);
          });
    });
 }

const EMPTY = new geo("empty");
