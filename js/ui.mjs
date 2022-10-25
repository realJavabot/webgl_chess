import { newBlankColorTex } from "./texture.mjs";
import { gl } from "./gameengine.mjs";
import { simple_shader_program } from "./shaders.mjs";

const states = {BASE:0, MOUSEOVER:1};
let update_ui = false;
let shaderProgram;

export default class UI{
    constructor(canvas, vertSource, fragSource){
        this.w = canvas.width;
        this.h = canvas.height;
        this.canvas = canvas;
        this._active = false;

        this.vBuffer = gl.createBuffer();
        this.iBuffer = gl.createBuffer();

        this.sp = shaderProgramFromSource(vertSource, fragSource);

        newBlankColorTex(canvas.width, canvas.height);

        this.fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
        
        ui_elements.push(new UI_Button(0,0,.1,.1), new UI_Square(-.5,0,.1,.1,[0,1,0,.5]));
        // ui_elements[0].onmousedown = ()=>{console.log("replaced!");};
        this.update();

        this.renderOb = {
            vertices: new Float32Array([-1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1]),
            indices:  new Uint16Array([0,1,2, 0,2,3]),
            normals: new Float32Array([0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1]),
            tex: new Float32Array([0,0, 1,0, 1,1, 0,1]),
            pmat: [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
            mmat: [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
            vmat: [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]
        };

        const elements_mouse_state = (event)=>{
            const x = (event.clientX - canvas.offsetLeft)/canvas.width - .5;
            const y = (canvas.height - event.clientY - window.scrollY + canvas.offsetTop)/canvas.height - .5;
            return ui_elements
                    .filter(el=>el.collision)
                    .map(el=> {
                        return {el, mouse_in:el.contains(x,y)};
                    });
        }

        canvas.addEventListener("mousemove",event=>{
            elements_mouse_state(event).forEach(({el, mouse_in})=>{
                if(el.state == states.BASE && mouse_in){
                    el.onmouseover();
                }
                else if(el.state == states.MOUSEOVER && !mouse_in){
                    el.onmouseout();
                }
            });
        });
        canvas.addEventListener("mousedown",event=>{
            elements_mouse_state(event)
                .filter(({mouse_in}) => mouse_in)
                .forEach(({el}) => el.onmousedown());
        });
    }

    get active(){return this._active;}
    set active(toggle){
        if(this._active = toggle){
            update_ui = true;
        }
    }

    update(){
        gl.useProgram(this.sp);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);

        gl.clearColor(0,0,0,0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);

        // have to re-enable relevant attributes when switching from other shader program
        const posAttribLoc = gl.getAttribLocation(this.sp, "position");
        gl.vertexAttribPointer(posAttribLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(posAttribLoc);

        const pMatLoc = gl.getUniformLocation(this.sp, "Pmatrix");
        const baseColLocation = gl.getUniformLocation(this.sp, "baseColor");

        ui_elements.forEach(el=>{
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(el.vertices), gl.STATIC_DRAW);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(el.indices), gl.STATIC_DRAW);

            gl.uniformMatrix3fv(pMatLoc, false, new Float32Array(el.transform));
            gl.uniform4f(baseColLocation, ...el.color);

            gl.drawElements(gl.TRIANGLES, el.indices.length, gl.UNSIGNED_SHORT, 0);
        });

        // copy result to texture in main shader
        gl.useProgram(shaderProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        enableBuffers();
    }

    render(buffers, Mmatrix, Vmatrix, texIndexLocation){
        if(!this.active){return;}

        if(update_ui){
            this.update();
            update_ui = false;
        }

        const buffer_data = (buffer_name, data) => {
            const bufValue = (buffer_name == "index_buffer")? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
            gl.bindBuffer(bufValue, buffers[buffer_name]);
            gl.bufferData(bufValue, data, gl.STATIC_DRAW);
         };

         buffer_data("vertex_buffer", this.renderOb.vertices);
         buffer_data("index_buffer", this.renderOb.indices);
         buffer_data("normal_buffer", this.renderOb.normals);
         buffer_data("tex_buffer", this.renderOb.tex);

        gl.uniformMatrix4fv(Mmatrix, false, this.renderOb.mmat);
        gl.uniformMatrix4fv(Vmatrix, false, this.renderOb.vmat);

        gl.uniform1f(texIndexLocation, 5);

        gl.enable(gl.BLEND);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        gl.disable(gl.BLEND);
    }   
}

const matMult2D = (a,b) => [
    a[0]*b[0]+a[3]*b[1]+a[6]*b[2], a[1]*b[0]+a[4]*b[1]+a[7]*b[2], a[2]*b[0]+a[5]*b[1]+a[8]*b[2],
    a[0]*b[3]+a[3]*b[4]+a[6]*b[5], a[1]*b[3]+a[4]*b[4]+a[7]*b[5], a[2]*b[3]+a[5]*b[4]+a[8]*b[5],
    a[0]*b[6]+a[3]*b[7]+a[6]*b[8], a[1]*b[6]+a[4]*b[7]+a[7]*b[8], a[2]*b[6]+a[5]*b[7]+a[8]*b[8]
];

const mvMult = (m, v) => [
    m[0]*v[0]+m[3]*v[1]+m[6],
    m[1]*v[0]+m[4]*v[1]+m[7]
];

class transformObject2D{
    constructor(x,y,w=1,h=1){
        this._pos = [0,0];
        this._dim = [1,1];
        this._rotation = 0;
        this.transform = [1,0,0, 0,1,0, 0,0,1];
        this.dim = [w,h];
        this.pos = [x,y];
    }
    get rotation(){return this._rotation;}
    set rotation(rads){
        this._rotation = rads;
        this.update_transform();
    }
    get dim(){return this._dim;}
    set dim(dims){
        this._dim = dims;
        this.update_transform();
    }
    get pos(){return this._pos;}
    set pos(newpos){
        this._pos = newpos;
        this.update_transform();
    }
    update_transform(){
        this.transform = [1,0,0, 0,1,0, 0,0,1];
        this.scale();
        this.rotate();
        this.translate();
    }
    rotate(){
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const r_mat = [cos,sin,0, -sin,cos,0, 0,0,1];
        this.transform = matMult2D(this.transform, r_mat);
    }
    scale(){
        this.transform[0] *= this.dim[0];
        this.transform[4] *= this.dim[1];
    }
    translate(){
        this.transform[6] += this.pos[0];
        this.transform[7] += this.pos[1];
    }
}

let ui_elements = [];

class UI_Square extends transformObject2D{
    constructor(x,y,w,h,color=[1,0,0,1]){
        super(x,y,w,h);
        this._color = color;
        this.vertices = [-1,-1, 1,-1, 1,1, -1,1] .map(v=>v*.5);
        this.indices = [0,1,2, 0,2,3];
        this.collision = false;
    }
    get color(){return this._color;}
    set color(new_col){
        this._color = new_col;
        update_ui = true;
    }
}

class UI_Button extends UI_Square{
    constructor(x,y,w,h,base_color=[1,0,0,1], hover_color=[1,1,0,1]){
        super(x,y,w,h, base_color);
        this.base_color = base_color;
        this.hover_color = hover_color;
        this.vertices = [-1,-.5, 1,-.5, 1,.5, -1,.5] .map(v=>v*.5);
        this.indices = [0,1,2, 0,2,3];
        this.collision = true;
        this.state = states.BASE;
    }
    onmouseover(){
        this.color = this.hover_color;
        this.state = states.MOUSEOVER;
    }
    onmouseout(){
        this.color = this.base_color;
        this.state = states.BASE;
    }
    onmousedown(){
        console.log("button pressed");
    }
    contains(x,y){
        return (
            this.pos[0]-this.dim[0]/2 < x && 
            this.pos[0]+this.dim[0]/2 > x && 
            this.pos[1]-this.dim[1]/2 < y && 
            this.pos[1]+this.dim[1]/2 > y
        );
    }
}