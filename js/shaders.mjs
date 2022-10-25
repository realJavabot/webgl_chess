import { gl, canvas } from "./gameengine.mjs";
import * as vecMath from './math.mjs';
import { newBlankColorTex } from "./texture.mjs";

const highlightcol = [0,1,0,1];
const hovercol = [1,0,1,1];
let texture_count = 0;

let current_shader_program = null;

function shaderProgramFromSource(vertSource, fragSource){
   const sp = gl.createProgram();
   const vertShader = gl.createShader(gl.VERTEX_SHADER);
   gl.shaderSource(vertShader, vertSource);
   gl.compileShader(vertShader);
   gl.attachShader(sp, vertShader);
         
   const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
   gl.shaderSource(fragShader, fragSource);
   gl.compileShader(fragShader);
   gl.attachShader(sp, fragShader);

   gl.linkProgram(sp);
   return sp;
}

class shader_program{
    constructor(){
       this.shaderProgram = null;
       this.uniforms = {};
       this.textures = [];
       this.images = {};
       this.buffers = {
          "vertex_buffer": gl.createBuffer(),
          "index_buffer": gl.createBuffer (),
          "normal_buffer": gl.createBuffer (),
          "tex_buffer": gl.createBuffer ()
       };
    }
 
    async init(init, enable){
       this.initialize = async () => { await init.call(this) };
       this.enable = async () => { 
         current_shader_program = this;
         await enable.call(this) 
      };
       await this.initialize();
       await this.enable();
    }
 
    loadImageIntoSampler(path, uniform_name){
      path = `/resources/${path}`;
       if(this.images[path]){
          this.loadTextureIntoSampler(uniform_name, this.images[path]);
          return;
       }
       return new Promise((resolve)=>{
          const image = new Image();
          
          image.onload = () => {
             const texture = gl.createTexture();
             this.images[path] = texture;
             this.loadTextureIntoSampler(uniform_name, texture);
             gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
 
             /*
             WebGL1 has different requirements for power of 2 images
             vs non power of 2 images so check if the image is a
             power of 2 in both dimensions.
             */
 
             if (vecMath.isPowerOf2(image.width) && vecMath.isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
             } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
             }
             resolve(true);
          };
 
          image.src = path;
       });
    }

    loadTextureIntoSampler(uniform_name, texture){
      gl.activeTexture(this.texIndex(uniform_name).index);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      this.textures[uniform_name].texture = texture;
    }
 
    texIndex(uniform_name){
      if(!this.textures[uniform_name]){
         this.setUniform(uniform_name, texture_count);
         this.textures[uniform_name] = {index: gl.TEXTURE0 + texture_count};
         texture_count++;
      }
      return this.textures[uniform_name];
    }
 
    setUniform(uniform_name, value){   
      if(current_shader_program != this){
         gl.useProgram(this.shaderProgram);
      }
       if(!this.uniforms[uniform_name]){
          this.uniforms[uniform_name] = gl.getUniformLocation(this.shaderProgram, uniform_name);
       }
       if(Array.isArray(value)){
          if(value.length == 16){
             gl.uniformMatrix4fv(this.uniforms[uniform_name], false, value);
          }
          if(value.length == 4){
             gl.uniform4fv(this.uniforms[uniform_name], value);
          }
          return;
       }
       gl.uniform1i(this.uniforms[uniform_name], value)
       if(current_shader_program != this){
         gl.useProgram(current_shader_program.shaderProgram);
      }
    }
 
    buffer(buffer_name, value){
       if(value !== this.buffers[buffer_name]){
          const bufValue = (buffer_name == "index_buffer")? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
          gl.bindBuffer(bufValue, this.buffers[buffer_name]);
          gl.bufferData(bufValue, value, gl.STATIC_DRAW);
       }
    }
 
    use(){
       gl.useProgram(this.shaderProgram);
       this.enable();
    }
 }

export let main_shader_program, simple_shader_program;

 export async function init_shaders(){
    // the main shader renders the meshes onto a framebuffer twice the size of the canvas
    main_shader_program = new shader_program();
    await main_shader_program.init(
        async function () {
            const vertSource = await (await fetch("shaders/main/vert.vs")).text();
            const fragSource = await (await fetch("shaders/main/frag.vs")).text();
            this.shaderProgram = shaderProgramFromSource(vertSource, fragSource);
            gl.useProgram(this.shaderProgram);

            this.proj_matrix = vecMath.get_projection(30, canvas.width/canvas.height, 1, 100);

            this.antialiasing_tex = newBlankColorTex(canvas.width*2, canvas.height*2);

            this.main_buffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.main_buffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.antialiasing_tex, 0);

            let depth_buffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, depth_buffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width*2, canvas.height*2);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth_buffer);
        },
        function () {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.main_buffer);

            this.setUniform("Pmatrix", this.proj_matrix);
            this.setUniform("Mmatrix", [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
            this.setUniform("baseColor", highlightcol);
            this.setUniform("hoverColor", hovercol);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers["vertex_buffer"]);
            const position = gl.getAttribLocation(this.shaderProgram, "position");
            gl.vertexAttribPointer(position, 3, gl.FLOAT, false,0,0) ;
            gl.enableVertexAttribArray(position);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers["normal_buffer"]);
            const normal = gl.getAttribLocation(this.shaderProgram, "normal");
            gl.vertexAttribPointer(normal, 3, gl.FLOAT, false,0,0);
            gl.enableVertexAttribArray(normal);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers["tex_buffer"]);
            const texcoor = gl.getAttribLocation(this.shaderProgram, "texcoor");
            gl.vertexAttribPointer(texcoor, 2, gl.FLOAT, false,0,0);
            gl.enableVertexAttribArray(texcoor);
        }
    );

    // the simple shader renders the above framebuffer and any other textures firectly to the canvas
    simple_shader_program = new shader_program();
    await simple_shader_program.init(
        async function () {
            const vert_source_simple = await (await fetch("shaders/simple/vert.vs")).text();
            const frag_source_simple = await (await fetch("shaders/simple/frag.vs")).text();
            this.shaderProgram = shaderProgramFromSource(vert_source_simple, frag_source_simple);

            this.renderOb = {
                vertices: new Float32Array([-1,-1, 1,-1, 1,1, -1,1]),
                indices:  new Uint16Array([0,1,2, 0,2,3])
            };
        },
        function () {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            gl.bindBuffer(gl.ARRAY_BUFFER,  this.buffers["vertex_buffer"])
            const posAttribLoc = gl.getAttribLocation(this.shaderProgram, "position");
            gl.vertexAttribPointer(posAttribLoc, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(posAttribLoc);
        }
    );
 }