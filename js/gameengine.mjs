import Camera from '/webgl_chess/js/camera.mjs';
import * as vecMath from '/webgl_chess/js/math.mjs';
import { tweens } from '/webgl_chess/js/animation.mjs';
import { meshes } from '/webgl_chess/js/mesh.mjs';
import UI from '/webgl_chess/js/ui.mjs';
import { init_shaders, main_shader_program, simple_shader_program } from '/webgl_chess/js/shaders.mjs';

export {setup, update, clickMeshes, rb, mouse, inputBuffer, gameUI, main_shader_program, camera};

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
export let canvas;
let inputBuffer;
export let gl;
let gameUI;
export let singleplayer = false;



async function setup(setupCallback, updateCallback){
   createCanvas();
   initgl();

   // const vertSource_ui = await (await fetch('./ui/vertex.vs')).text();
   // const fragSource_ui = await (await fetch('./ui/frag.vs')).text();
   // gameUI = new UI(canvas, gl, vertSource_ui, fragSource_ui);

   await init_shaders();

   rb = gl.createRenderbuffer();
   gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
   gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, gl.canvas.width, gl.canvas.height);
   gl.bindRenderbuffer(gl.RENDERBUFFER, null);

   await setupCallback();

   meshes.sort(function(a, b){
      if(a.geometry.name < b.geometry.name) { return -1; }
      if(a.geometry.name > b.geometry.name) { return 1; }
      return 0;
  });

   window.setInterval(()=>{
      update();
      updateCallback();
   });

   render();
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
      // gl.uniformMatrix4fv(Vmatrix, false, camera.transform);
      camera.update = false;
   }
}

function render() {
   main_shader_program.use();

   main_shader_program.setUniform('Vmatrix', camera.transform);

   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   let last = {geometry:{}};
   meshes.forEach(mesh=>{
     main_shader_program.buffer('vertex_buffer', mesh.geometry.vertices);
     main_shader_program.buffer('index_buffer', mesh.geometry.indices);
     main_shader_program.buffer('normal_buffer', mesh.geometry.normals);
     main_shader_program.buffer('tex_buffer', mesh.geometry.texcoors);

      main_shader_program.setUniform('Mmatrix',mesh.transform);
      main_shader_program.setUniform('rotationMat', mesh.rotationMat);
      if(last.texindex != mesh.texindex){ 
         main_shader_program.setUniform('TexIndex', mesh.texindex);
      }

      gl.drawElements(gl.TRIANGLES, mesh.geometry.indices.length, gl.UNSIGNED_SHORT, 0);

      last = mesh;
   });

   // gameUI.render(buffers, Mmatrix, Vmatrix, texIndexLocation);

   simple_shader_program.use();
   simple_shader_program.loadTextureIntoSampler('buffer', main_shader_program.antialiasing_tex);

   gl.bindBuffer(gl.ARRAY_BUFFER, simple_shader_program.buffers['vertex_buffer']);
   gl.bufferData(gl.ARRAY_BUFFER, simple_shader_program.renderOb.vertices, gl.STATIC_DRAW);

   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, simple_shader_program.buffers['index_buffer']);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, simple_shader_program.renderOb.indices, gl.STATIC_DRAW);

   gl.drawElements(gl.TRIANGLES, simple_shader_program.renderOb.indices.length, gl.UNSIGNED_SHORT, 0);

   simple_shader_program.loadImageIntoSampler('vignette.png', 'buffer');
   gl.drawElements(gl.TRIANGLES, simple_shader_program.renderOb.indices.length, gl.UNSIGNED_SHORT, 0);

   window.requestAnimationFrame(render);
}

let rb;

function createCanvas(){
   canvas = document.getElementById('my_Canvas');

   canvas.addEventListener('mousedown', (e) =>{
      mouse.state = mouse.states.DOWN;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
   });

   canvas.addEventListener('mouseup', (e) =>{
      mouse.state = mouse.states.UP;
      mouse.dragging = false;
   });

   canvas.addEventListener('wheel', (e) => {
      camera.setOrbitRadius(camera.radius + Math.sign(e.wheelDelta));
   });

   canvas.addEventListener('mousemove', (e) =>{
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
   gl = canvas.getContext('experimental-webgl',{});
   gl.enable(gl.DEPTH_TEST);
   gl.enable(gl.BLEND);
   gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
   gl.depthFunc(gl.LEQUAL);
   gl.clearColor(0.5, 0.5, 0.5, 0.9);

   gl.viewport(0.0, 0.0, canvas.width*2, canvas.height*2);

   // gl =  WebGLDebugUtils.makeDebugContext(gl, throwOnGLError, logAndValidate);
}

function clickMeshes(e){
   main_shader_program.use();
   gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
   gl.viewport(0.0, 0.0, canvas.width, canvas.height);
   
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   main_shader_program.setUniform('TexIndex', 3);
   main_shader_program.setUniform('Vmatrix', camera.transform);

   let last = {geometry:{}};
   meshes.forEach(mesh=>{
      main_shader_program.buffer('vertex_buffer', mesh.geometry.vertices);
      main_shader_program.buffer('index_buffer', mesh.geometry.indices);
      main_shader_program.buffer('normal_buffer', mesh.geometry.normals);
      main_shader_program.buffer('tex_buffer', mesh.geometry.texcoors);

      main_shader_program.setUniform('Mmatrix', mesh.transform);
      main_shader_program.setUniform('baseColor', [mesh.index/255,0,0,1]);

      gl.drawElements(gl.TRIANGLES, mesh.geometry.indices.length, gl.UNSIGNED_SHORT, 0);

      last = mesh;
   });

   const pixel = new Uint8Array(4);
   gl.readPixels(
      e.clientX - canvas.offsetLeft,
      canvas.height - e.clientY - window.scrollY + canvas.offsetTop, 
      1, 1, gl.RGBA, gl.UNSIGNED_BYTE, 
      pixel
   );
      
   main_shader_program.setUniform('baseColor', [0,1,0,1]);
   main_shader_program.setUniform('Mmatrix', [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
   gl.bindRenderbuffer(gl.RENDERBUFFER, null);
   gl.viewport(0.0, 0.0, canvas.width*2, canvas.height*2);

   const index = pixel[0] + pixel[1] + pixel[2];
   
   return meshes.find(e=>e.index == index);
}

export function singleplayer_false(){
   singleplayer = false;
}

export function demoRoom(){
   singleplayer = true;
}





//-------------------DEBUG CODE-------------------

import {WebGLDebugUtils} from '/webgl_chess/js/webgl-debug.mjs';

function throwOnGLError(err, funcName, args) {
   throw WebGLDebugUtils.glEnumToString(err) + ' was caused by call to: ' + funcName;
 };

 function validateNoneOfTheArgsAreUndefined(functionName, args) {
   for (var ii = 0; ii < args.length; ++ii) {
     if (args[ii] === undefined) {
       console.error('undefined passed to gl.' + functionName + '(' +
                      WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ')');
     }
   }
 } 

 function logGLCall(functionName, args) {   
   console.log('gl.' + functionName + '(' + 
      WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ')');   
} 

function logAndValidate(functionName, args) {
   logGLCall(functionName, args);
   validateNoneOfTheArgsAreUndefined (functionName, args);
}
//-------------------END DEBUG CODE-------------------