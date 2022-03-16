import {gl, shaderProgram} from "./gameengine.mjs";
import { isPowerOf2 } from "./math.mjs";
export {loadTexFromImage, texIndex};

let numTextures = 0;

function loadTexFromImage(path, uniform_name){
   return new Promise((resolve)=>{
      const image = new Image();
      
      image.onload = () => {
         const texture = gl.createTexture();
         gl.activeTexture(texIndex(uniform_name));
         gl.bindTexture(gl.TEXTURE_2D, texture);
         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

         /*
         WebGL1 has different requirements for power of 2 images
         vs non power of 2 images so check if the image is a
         power of 2 in both dimensions.
         */

         if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
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

 function texIndex(uniform_name){
   const texture_location = gl.getUniformLocation(shaderProgram, uniform_name);
   gl.uniform1i(texture_location, numTextures);
   numTextures++;
   return gl.TEXTURE0 + numTextures-1;
 }