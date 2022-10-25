import * as vecMath from './math.mjs';
export {geo, geoParams, geos, loadGeometry};

const geos = {};

class geoParams{
   constructor(vertices=[], texcoors=[], normals=[], indices=[]){
      this.vertices = vertices;
      this.texcoors = texcoors;
      this.normals = normals;
      this.indices = indices;
   }
}

class geo{
    constructor(name, params = new geoParams()){
       this.length = params.vertices.length;
       this.vertices = new Float32Array(params.vertices);
       this.texcoors = new Float32Array(params.texcoors);
       this.normals = new Float32Array(params.normals);
       this.indices = new Uint16Array(params.indices);
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

 async function loadGeometry(path, name){
   path = `/webgl_chess/resources/${path}`;

   const tn = [];
   const tt = [];
   const obParams = new geoParams();
   const text = await (await fetch(path).then(response => response.text())).split("\n");
    
   return new Promise((resolve, reject)=>{
      text.forEach(line=>{
         line = line.split(" ");
         if(line[0] == "v"){
            obParams.vertices.push(
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
               obParams.normals[point*3] = tn[parseInt(group[2])-1][0];
               obParams.normals[point*3+1] = tn[parseInt(group[2])-1][1];
               obParams.normals[point*3+2] = tn[parseInt(group[2])-1][2];
               obParams.texcoors[point*2] = tt[parseInt(group[1])-1][0];
               obParams.texcoors[point*2+1] = tt[parseInt(group[1])-1][1];
            });
            obParams.indices.push(points[0],points[1],points[2]);
            if(points.length == 4){
               obParams.indices.push(points[0],points[2],points[3]);
            }
         }
      });

      const ob = new geo(name, obParams);
      ob.length = obParams.vertices.length;

      resolve(true);
   });
 }