import Camera from "./camera.mjs";
import * as vecMath from './math.mjs';
import { tweens } from './animation.mjs';
import { meshes, meshbuffers, generateMeshBuffers } from "./mesh.mjs";
import { pieces_sorted, squares } from './gameObjects.mjs'; 
import { geos } from "./geometry.mjs";

export {setup, update, clickMeshes, rb, mouse};

const mouse = {
   states: {
      UP: 0,
      DOWN: 1
   },
   x:0,
   y:0,
   state: 0,
   dragging:false
};
const camera = new Camera(0,1.1,-15);
const highlightcol = [0,1,0,1];
const hovercol = [1,0,1,1];
let canvas;
let selected = 0;
let shaderProgram;
let fb;
export let gl;

async function setup(setupCallback, updateCallback){
   createCanvas();
   initgl();

   shaderProgram = gl.createProgram();

   const vertSource = await (await fetch("vertex.vs")).text();
   const vertShader = gl.createShader(gl.VERTEX_SHADER);
   gl.shaderSource(vertShader, vertSource);
   gl.compileShader(vertShader);
   gl.attachShader(shaderProgram, vertShader);
         
   const fragSource = await (await fetch("frag.vs")).text();
   const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
   gl.shaderSource(fragShader, fragSource);
   gl.compileShader(fragShader);
   gl.attachShader(shaderProgram, fragShader);

   setupBuffers();
   setupShaderProgram();
   setupUniforms();
   await setupCallback();
   //generateMeshBuffers();
   window.setInterval(()=>{
      update();
      updateCallback();
   });
   render();
}

let Pmatrix;
let Mmatrix;
let baseColor;
let Vmatrix;
let texIndexLocation;
function setupUniforms(){
   Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix");
   Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix");
   Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix");
   texIndexLocation = gl.getUniformLocation(shaderProgram, "TexIndex");
   baseColor = gl.getUniformLocation(shaderProgram, "baseColor");
   let hoverColor = gl.getUniformLocation(shaderProgram, "hoverColor");

   const proj_matrix = vecMath.get_projection(30, canvas.width/canvas.height, 1, 100);
   const mov_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

   gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
   gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);
   gl.uniform4fv(baseColor, highlightcol);
   gl.uniform4fv(hoverColor, hovercol);
}

function update(){
   meshes.forEach(m=>{
      if(!m.buffer){return;}
      if(m.update){
         m.buffer.vertices.splice(m.index, m.geometry.length, ...m.geometry.getVerts(m.transform));
         m.buffer.texindexarray.splice(m.index/3, m.geometry.length/3,...new Array(m.geometry.length/3).fill(m.texindex+.5));
         m.update = false;
      }
   });
   tweens.forEach(tween=>{
      tween.update();
   });
   if(camera.update){
      gl.uniformMatrix4fv(Vmatrix, false, camera.transform);
      camera.update = false;
   }
}

function render() {
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   Object.keys(pieces_sorted).forEach(k=>{
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers["vertex_buffer"]);
      gl.bufferData(gl.ARRAY_BUFFER, geos[k].vertices, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers["index_buffer"]);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geos[k].indices, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers["normal_buffer"]);
      gl.bufferData(gl.ARRAY_BUFFER, geos[k].normals, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers["tex_buffer"]);
      gl.bufferData(gl.ARRAY_BUFFER, geos[k].texcoors, gl.STATIC_DRAW);

      let lastCol;
      pieces_sorted[k].forEach(piece=>{
         gl.uniformMatrix4fv(Mmatrix, false, piece.mesh.transform);
         if(piece.mesh.texindex != lastCol){ 
            gl.uniform1f(texIndexLocation, piece.mesh.texindex);
            lastCol = piece.mesh.texindex;
         }
         gl.drawElements(gl.TRIANGLES, geos[k].indices.length, gl.UNSIGNED_SHORT, 0);
      });
   });

   const square_geo = squares[0][0].geometry;

   gl.bindBuffer(gl.ARRAY_BUFFER, buffers["vertex_buffer"]);
   gl.bufferData(gl.ARRAY_BUFFER, square_geo.vertices, gl.STATIC_DRAW);

   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers["index_buffer"]);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, square_geo.indices, gl.STATIC_DRAW);

   gl.bindBuffer(gl.ARRAY_BUFFER, buffers["normal_buffer"]);
   gl.bufferData(gl.ARRAY_BUFFER, square_geo.normals, gl.STATIC_DRAW);

   let lastTexIndex;
   squares.forEach(row=>{
      row.forEach(square=>{
         if(lastTexIndex != square.mesh.texindex){
            gl.uniform1f(texIndexLocation, square.mesh.texindex);
            lastTexIndex = square.mesh.texindex;
         }
         gl.bindBuffer(gl.ARRAY_BUFFER, buffers["tex_buffer"]);
         gl.bufferData(gl.ARRAY_BUFFER, square.geometry.texcoors, gl.STATIC_DRAW);
         gl.uniformMatrix4fv(Mmatrix, false, square.mesh.transform);
         gl.drawElements(gl.TRIANGLES, square_geo.indices.length, gl.UNSIGNED_SHORT, 0);
      });
   });

   meshes.forEach(mesh=>{
      if(typeof mesh.ob === 'undefined'){
         gl.bindBuffer(gl.ARRAY_BUFFER, buffers["vertex_buffer"]);
         gl.bufferData(gl.ARRAY_BUFFER, mesh.geometry.vertices, gl.STATIC_DRAW);

         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers["index_buffer"]);
         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.geometry.indices, gl.STATIC_DRAW);

         gl.bindBuffer(gl.ARRAY_BUFFER, buffers["normal_buffer"]);
         gl.bufferData(gl.ARRAY_BUFFER, mesh.geometry.normals, gl.STATIC_DRAW);

         gl.bindBuffer(gl.ARRAY_BUFFER, buffers["tex_buffer"]);
         gl.bufferData(gl.ARRAY_BUFFER, mesh.geometry.texcoors, gl.STATIC_DRAW);

         gl.uniformMatrix4fv(Mmatrix, false, mesh.transform);
         gl.uniform1f(texIndexLocation, mesh.texindex);

         gl.drawElements(gl.TRIANGLES, mesh.geometry.indices.length, gl.UNSIGNED_SHORT, 0);
      }
   })

   window.requestAnimationFrame(render);
}

const buffers = {};
let rb;
function setupBuffers(){
   buffers["vertex_buffer"] = gl.createBuffer ();
   buffers["index_buffer"] = gl.createBuffer ();
   buffers["normal_buffer"] = gl.createBuffer ();
   buffers["tex_buffer"] = gl.createBuffer ();

   rb = gl.createRenderbuffer();
   gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
   gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, gl.canvas.width, gl.canvas.height);
   gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
   gl.bindRenderbuffer(gl.RENDERBUFFER, null);
}

function setupShaderProgram(){
   gl.linkProgram(shaderProgram);

   gl.bindBuffer(gl.ARRAY_BUFFER, buffers["vertex_buffer"]);
   const position = gl.getAttribLocation(shaderProgram, "position");
   gl.vertexAttribPointer(position, 3, gl.FLOAT, false,0,0) ;
   gl.enableVertexAttribArray(position);

   gl.bindBuffer(gl.ARRAY_BUFFER, buffers["normal_buffer"]);
   const normal = gl.getAttribLocation(shaderProgram, "normal");
   gl.vertexAttribPointer(normal, 3, gl.FLOAT, false,0,0);
   gl.enableVertexAttribArray(normal);

   gl.bindBuffer(gl.ARRAY_BUFFER, buffers["tex_buffer"]);
   const texcoor = gl.getAttribLocation(shaderProgram, "texcoor");
   gl.vertexAttribPointer(texcoor, 2, gl.FLOAT, false,0,0);
   gl.enableVertexAttribArray(texcoor);

   gl.useProgram(shaderProgram);
}

function createCanvas(){
   canvas = document.getElementById('my_Canvas');

   canvas.addEventListener("mousedown", (e) =>{
      mouse.state = mouse.states.DOWN;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
   });

   canvas.addEventListener("mouseup", (e) =>{
      mouse.state = mouse.states.UP;
      mouse.dragging = false;
   });

   canvas.addEventListener("wheel", (e) => {
      camera.setOrbitRadius(camera.radius + Math.sign(e.wheelDelta));
   });

   canvas.addEventListener("mousemove", (e) =>{
      switch(mouse.state){
         case mouse.states.UP: {
         }break;
         case mouse.states.DOWN: {
            mouse.dragging = true;

            let newRotation = vecMath.add([...camera.rotation,0], vecMath.multScalar([e.x - mouse.x, e.y - mouse.y, 0], 1/100));
            camera.setOrbitRotation(...newRotation);

            mouse.x = e.x;
            mouse.y = e.y;

         }break;
      }
   });
}

function initgl(){
   gl = canvas.getContext('experimental-webgl',{preserveDrawingBuffer: true});
   gl.enable(gl.DEPTH_TEST);
   gl.depthFunc(gl.LEQUAL);
   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.clearDepth(1.0);

   gl.viewport(0.0, 0.0, canvas.width, canvas.height);
}

function clickMeshes(e){
   gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
  
   gl.uniform1f(texIndexLocation, 3);

   Object.keys(pieces_sorted).forEach(k=>{
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers["vertex_buffer"]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geos[k].vertices), gl.STATIC_DRAW);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers["index_buffer"]);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geos[k].indices), gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers["normal_buffer"]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geos[k].normals), gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers["tex_buffer"]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geos[k].texcoors), gl.STATIC_DRAW);

      pieces_sorted[k].forEach(piece=>{
         gl.uniformMatrix4fv(Mmatrix, false, piece.mesh.transform);
         gl.uniform4fv(baseColor, [piece.mesh.index/255,0,0,1]);
         gl.drawElements(gl.TRIANGLES, geos[k].indices.length, gl.UNSIGNED_SHORT, 0);
      });
   });

   const square_geo = squares[0][0].geometry;

   gl.bindBuffer(gl.ARRAY_BUFFER, buffers["vertex_buffer"]);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(square_geo.vertices), gl.STATIC_DRAW);

   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers["index_buffer"]);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(square_geo.indices), gl.STATIC_DRAW);

   gl.bindBuffer(gl.ARRAY_BUFFER, buffers["normal_buffer"]);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(square_geo.normals), gl.STATIC_DRAW);

   squares.forEach(row=>{
      row.forEach(square=>{
         gl.uniform4fv(baseColor, [square.mesh.index/255,0,0,1]);
         gl.bindBuffer(gl.ARRAY_BUFFER, buffers["tex_buffer"]);
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(square.geometry.texcoors), gl.STATIC_DRAW);
         gl.uniformMatrix4fv(Mmatrix, false, square.mesh.transform);
         gl.drawElements(gl.TRIANGLES, square_geo.indices.length, gl.UNSIGNED_SHORT, 0);
      });
   });

   const pixel = new Uint8Array(4);
   gl.readPixels(
      e.clientX - canvas.offsetLeft,
      canvas.height - e.clientY - window.scrollY + canvas.offsetTop, 
      1, 1, gl.RGBA, gl.UNSIGNED_BYTE, 
      pixel
   );
      
   gl.uniform4fv(baseColor, highlightcol);
   gl.uniformMatrix4fv(Mmatrix, false, [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
   gl.bindRenderbuffer(gl.RENDERBUFFER, null);
   return pixel[0] + pixel[1] + pixel[2];
}