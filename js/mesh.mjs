import transformObject from '/webgl_chess/js/transformObject.mjs';
import { geos } from '/webgl_chess/js/geometry.mjs'; 
export {mesh, meshes, generateMeshBuffers, meshbuffers};
const meshes = [];
const meshbuffers = [];

class meshbuffer{
    constructor(){
       this.vertices = [];
       this.texcoors = [];
       this.normals = [];
       this.indices = [];
       this.texindexarray = [];
    }
 }

class mesh extends transformObject{
   constructor(geometry, x, y, z, s){
      super(x, y, z, s);
      this.texindex = 0;
      this.geometry = geos[geometry];
      this.index = meshes.length;
      meshes.push(this);
   }

   rayCollision(orig, dir){
      let result = false;
      const smallestDist = 100000;
      for(const i=0; i<this.geometry.indices.length; i+=3){
         const i1 = this.geometry.indices[i]*3,
               i2 = this.geometry.indices[i+1]*3,
               i3 = this.geometry.indices[i+2]*3;

         let v1 = add(this.geometry.vertices.slice(i1,i1+3),this.pos),
               v2 = add(this.geometry.vertices.slice(i2,i2+3),this.pos),
               v3 = add(this.geometry.vertices.slice(i3,i3+3),this.pos);
               v1[1] *= -1;
               v2[1] *= -1;
               v3[1] *= -1;

         const n1 = this.geometry.normals.slice(i1,i1+3),
               n2 = this.geometry.normals.slice(i2,i2+3),
               n3 = this.geometry.normals.slice(i3,i3+3);

         // average the vertex normals for a face normal
         const normal = [ 
            n1[0]+n2[0]+n3[0], 
            n1[1]+n2[1]+n3[1], 
            n1[2]+n2[2]+n3[2]
         ].map( el => { return el/3; });

         // triangle is on plane: Ax + By + Cz + D = 0
         const D = dot(normal, v1); 
         const temp = dot(normal, dir);

         // don't want to divide by zero
         if(temp==0){
            continue;
         }

         // Formula derived at https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/ray-triangle-intersection-geometric-solution
         // t is the distance ray has to travel from orig in direction dir to hit the plane the triangle is on
         const t = -(dot(normal, orig) + D) / temp;

         // if plane is behind orig (opposite direction of dir)
         if(t<0){
            continue;
         }

         const P = add(orig, multScalar(dir,t)),
            edges = [sub(v2, v1), sub(v3, v2), sub(v1, v3)],
            diffs = [sub(P,  v1), sub(P,  v2), sub(P,  v3)],
            dist = lengthSquared(sub(P,orig));
         // smallestDist ensures the closest triangle intersected is returned
         // if any of the dot product are negative, then the found point lies outside of the triangle
         if(dist < smallestDist &&
            dot(normal,cross(edges[1],diffs[1])) >= 0 &&
            dot(normal,cross(edges[2],diffs[2])) >= 0 &&
            dot(normal,cross(edges[3],diffs[3])) >= 0){
            result = [P,normal];
            smallestDist = dist;
         }
      }
      return result;
   }

   setTexIndex(i){
      this.texindex = i;
      this.update = true;
   }
}

function generateMeshBuffers(){
   const mesh123 = meshes.sort((a,b)=>{ return a.geometry.length-b.geometry.length; });
            
   let currentbuffer = 0;
   meshbuffers[0] = new meshbuffer();

   meshes.forEach(m=>{
      let curb = meshbuffers[currentbuffer];
      if(curb.vertices.length/3 + m.geometry.length/3 > 60000){
         currentbuffer++;
         curb = meshbuffers[currentbuffer] = new meshbuffer();
      }
      m.index = curb.vertices.length;
      const currentLength = curb.vertices.length/3;
      curb.vertices.push(...m.geometry.getVerts(m.transform));
      curb.indices.push(...m.geometry.indices.map(e=>{return e+currentLength;}));
      curb.normals.push(...m.geometry.getNormals(m.rotationMat));
      curb.texcoors.push(...m.geometry.texcoors);
      curb.texindexarray.push(...new Array(m.geometry.length/3).fill(m.texindex));
      m.buffer = curb;
   });
}