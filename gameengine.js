const states = {
   UP: 0,
   DOWN: 1
}
const mouse = {x:0,y:0,state:states.UP};
const camera = new Camera(0,0.8,-15);
const highlightcol = [0,1,0,1];
const hovercol = [1,0,1,1];
let dragging = false;
let canvas;
let selected = 0;
let shaderProgram;
let fb;

async function setup(callback){
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
   callback();
   render();
}

let Pmatrix;
let Mmatrix;
let baseColor;
function setupUniforms(){
   Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix");
   Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix");
   Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix");
   baseColor = gl.getUniformLocation(shaderProgram, "baseColor");
   hoverColor = gl.getUniformLocation(shaderProgram, "hoverColor");

   const proj_matrix = get_projection(30, canvas.width/canvas.height, 1, 100);
   const mov_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

   gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
   gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);
   gl.uniform4fv(baseColor, highlightcol);
   gl.uniform4fv(hoverColor, hovercol);
}

function update(callback){
   meshes.forEach(m=>{
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
   callback();
}

function render() {
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   meshbuffers.forEach(mb=>{
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers["vertex_buffer"]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mb.vertices), gl.STATIC_DRAW);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers["index_buffer"]);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mb.indices), gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers["normal_buffer"]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mb.normals), gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers["tex_buffer"]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mb.texcoors), gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers["tex_index_buffer"]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mb.texindexarray), gl.STATIC_DRAW);
      gl.drawElements(gl.TRIANGLES, mb.indices.length, gl.UNSIGNED_SHORT, 0);
   });

   window.requestAnimationFrame(render);
}

const buffers = {};
function setupBuffers(){
   buffers["vertex_buffer"] = gl.createBuffer ();
   buffers["index_buffer"] = gl.createBuffer ();
   buffers["normal_buffer"] = gl.createBuffer ();
   buffers["tex_buffer"] = gl.createBuffer ();
   buffers["tex_index_buffer"] = gl.createBuffer();

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

   gl.bindBuffer(gl.ARRAY_BUFFER, buffers["tex_index_buffer"]);
   const texIndex = gl.getAttribLocation(shaderProgram, "textureindex");
   gl.vertexAttribPointer(texIndex, 1, gl.FLOAT, false,0,0);
   gl.enableVertexAttribArray(texIndex);

   gl.useProgram(shaderProgram);
}

function createCanvas(){
   canvas = document.getElementById('my_Canvas');

   canvas.addEventListener("mousedown", (e) =>{
      mouse.state = states.DOWN;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
   });

   canvas.addEventListener("mouseup", (e) =>{
      mouse.state = states.UP;
      dragging = false;
   });

   canvas.addEventListener("wheel", (e) => {
      camera.setOrbitRadius(camera.radius + Math.sign(e.wheelDelta));
   });

   canvas.addEventListener("mousemove", (e) =>{
      switch(mouse.state){
         case states.UP: {
         }break;
         case states.DOWN: {
            dragging = true;

            let newRotation = add([...camera.rotation,0], multScalar([e.x - mouse.x, e.y - mouse.y, 0], 1/100));
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
   let last;

   gl.bindRenderbuffer(gl.RENDERBUFFER, rb);

   meshes.forEach((m, index)=>{
      if(!last || m.geometry != last.geometry || m.texIndex != last.tex){
         last = m;
         gl.bindBuffer(gl.ARRAY_BUFFER, buffers["vertex_buffer"]);
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.geometry.vertices), gl.STATIC_DRAW);

         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers["index_buffer"]);
         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(m.geometry.indices), gl.STATIC_DRAW);

         gl.bindBuffer(gl.ARRAY_BUFFER, buffers["normal_buffer"]);
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.geometry.normals), gl.STATIC_DRAW);

         gl.bindBuffer(gl.ARRAY_BUFFER, buffers["tex_buffer"]);
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.geometry.texcoors), gl.STATIC_DRAW);
      }
      gl.uniformMatrix4fv(Mmatrix, false, m.transform);
      gl.uniform4fv(baseColor, [index/255,0,0,1]);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers["tex_index_buffer"]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.geometry.indices.length).fill(3), gl.STATIC_DRAW);
      gl.drawElements(gl.TRIANGLES, m.geometry.indices.length, gl.UNSIGNED_SHORT, 0);
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