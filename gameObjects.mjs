import { mesh } from "./mesh.mjs";
import { geo } from "./geometry.mjs";
import { Tween, Bezier, Path } from "./animation.mjs";
export { piece, pieces, square, squares, spawnPieces, taken};

const BOARDOFFSET = -1;

const pieces = [];
const taken = [];
const pieceSize = .15;

class piece{
    boardTran(x,y,z=0){
      this.mesh.setTransform([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
      this.mesh.scale(pieceSize, pieceSize, pieceSize);
      this.mesh.translate(x-3.6,BOARDOFFSET - .2+z,y-3.5);
      if(this.type == "knight" && this.color == "white"){
         this.mesh.rotateY(1.5);
         this.mesh.translate(0.1,0,.1);
      }
      if(this.type == "knight" && this.color == "black"){
         this.mesh.rotateY(-1.5);
         this.mesh.translate(0.1,0,-.1);
      }
      if(this.type == "bishop" && this.color == "black"){
         this.mesh.rotateY(3.14);
         this.mesh.translate(.2,0,0);
      }
    }
    constructor(type,color,x=0,y=0){
       this.type = type;
       this.color = color;
       this.pos = [x,y];
       this.mesh = new mesh(type);
       this.boardTran(x,y);
       
       if(type == "pawn"){
          this.firstMove = true;
       }

       this.mesh.ob = this;
       this.mesh.texindex = (this.color == "white")? 1 : 2;
       this.path = false;
       this.tween = false;
       pieces.push(this);
    }

    moveTo(x,y){
      pieces.forEach(p=>{
         if(p.pos[0] == x && p.pos[1] == y){
            p.delete();
         }
      });

      if(this.firstMove){
         this.firstMove = false;
      }
      
      if(this.type == "knight"){
         this.path = new Bezier([this.pos[0],this.pos[1],0, this.pos[0],this.pos[1],5, x,y,5, x,y,0]);
      }else{
         this.path = new Path(...this.pos, x, y);
      }
      if(this.tween){
         this.tween.reset();
      }else{
         this.tween = new Tween(.07);
      }
      this.pos = [x,y];
   }

    setPos(x,y){
      pieces.forEach(p=>{
         if(p.pos[0] == x && p.pos[1] == y){
            p.delete();
         }
      });

      if(this.firstMove){
         this.firstMove = false;
      }
       this.mesh.translate(x-this.pos[0],0,y-this.pos[1]);
       this.pos = [x,y];
    }
    showMoves(){
       switch(this.type){
          case "pawn": return movepawn(this); break;
          case "rook": return moverook(this); break;
          case "knight": return moveknight(this); break;
          case "bishop": return movebishop(this); break;
          case "queen": return movequeen(this); break;
          case "king": return moveking(this); break;
       }
    }

    getMoveLine(offset){
       const pos = [...this.pos];
       const moves = [];
       while(true){
         pos[0] += offset[0];
         pos[1] += offset[1];
         if(pos[0] < 0 || pos[0] > 7 || pos[1] < 0 || pos[1] > 7){
            break;
         }
         const newmove = new move([...pos]);
         if(moves[moves.length-1]){
            moves[moves.length-1].to = newmove;
         }
         moves.push(newmove);
       }
       return moves;
    }

    delete(){
      this.resetTexIndex();

      const dir = (this.color == 'white')? -1 : 1;
      const numpieces = taken.filter(e=>e.color==this.color).length;
      const colheight = 4;
      const x = -Math.floor(numpieces/colheight)-2;
      const y = 3.5 + dir * (numpieces + colheight*(x+2)) + dir/2;
      this.path = new Bezier([this.pos[0],this.pos[1],0, this.pos[0],this.pos[1],8, x,y,8, x,y,0]);
      if(this.tween){
         this.tween.reset();
      }else{
         this.tween = new Tween(.07);
      }
       this.pos = [-1,-1];
       pieces.splice(pieces.indexOf(this),1);
       taken.push(this);
    }

    /*delete(){
      pieces.splice(pieces.indexOf(this),1);
      meshes.splice(meshes.indexOf(this.mesh),1);
      generateMeshBuffers();
    }*/

    update(){
       if(this.tween && this.path){
          if(!this.tween.paused){
            const nextPos = this.path.at(this.tween.percent);
            this.boardTran(...nextPos);
          }else{
            this.tween.delete();
            this.tween = false;
            this.boardTran(...this.path.end);
          }
       }
    }

    resetTexIndex(){
      this.mesh.setTexIndex((this.color == "white")? 1 : 2);
    }
 }

 class move{
    constructor(pos, to){
      this.to = to;
      this.pos = pos;
    }
    remove(){
       if(this.to){
          this.to.remove();
       }
       this.pos = [-1,-1];
    }
 }

 function clearAvailable(available, to_p, from_p){
   available.forEach(mov=>{
      if(mov.pos[0] == to_p.pos[0] && mov.pos[1] == to_p.pos[1]){
         if(to_p.color == from_p.color || (from_p.type == "pawn" && from_p.pos[0] == to_p.pos[0])){
            mov.remove()
         }else if(mov.to){
            mov.to.remove();
         }
      }
   });
 }

 function movepawn(piece){
   const pos = piece.pos;
   const dir = (piece.color == "white")? -1 :  1;
   const available = [new move([pos[0],pos[1]+1*dir])];
   if(piece.firstMove){
      const secondMove = new move([pos[0],pos[1]+2*dir]);
      available[0].to = secondMove;
      available.push(secondMove);
   }
   pieces.forEach(p=>{
      clearAvailable(available,p,piece);
      if(  p.color != piece.color && 
         ((p.pos[0] == pos[0]-1 && p.pos[1] == pos[1]+1*dir) || 
          (p.pos[0] == pos[0]+1 && p.pos[1] == pos[1]+1*dir))){
            available.push(new move(p.pos));
         }
   });
   return available;
 }

 function moverook(piece){
   const available = [
                    ...piece.getMoveLine([1,0]),
                    ...piece.getMoveLine([-1,0]),
                    ...piece.getMoveLine([0,-1]),
                    ...piece.getMoveLine([0,1])
                  ];
   pieces.forEach(p=>{
      clearAvailable(available,p,piece);
   });
   return available;
 }

function moveLocal(p,x,y){
   if(p.pos[0]+x >= 0 && p.pos[0]+x < 8 &&
      p.pos[1]+y >= 0 && p.pos[1]+y < 8){
      return new move([p.pos[0]+x,p.pos[1]+y]);
   }
   return new move([-1,-1]);
}

 function moveknight(piece){
    const available = [
      moveLocal(piece,-1,-2), 
      moveLocal(piece,-2,-1), 
      moveLocal(piece,-1,2), 
      moveLocal(piece,1,2), 
      moveLocal(piece,1,-2), 
      moveLocal(piece,2,-1), 
      moveLocal(piece,-2,1), 
      moveLocal(piece,2,1)
   ];
   pieces.forEach(p=>{
     clearAvailable(available,p,piece);
   });
   return available;
 }

 function movebishop(piece){
   const available = [
      ...piece.getMoveLine([1,1]),
      ...piece.getMoveLine([-1,1]),
      ...piece.getMoveLine([1,-1]),
      ...piece.getMoveLine([-1,-1])
    ];
   pieces.forEach(p=>{
      clearAvailable(available,p,piece);
   });
   return available;
 }

 function movequeen(piece){
   const available = [
      ...piece.getMoveLine([1,1]),
      ...piece.getMoveLine([-1,1]),
      ...piece.getMoveLine([1,-1]),
      ...piece.getMoveLine([-1,-1]),
      ...piece.getMoveLine([1,0]),
      ...piece.getMoveLine([-1,0]),
      ...piece.getMoveLine([0,-1]),
      ...piece.getMoveLine([0,1])
    ];
   pieces.forEach(p=>{
      clearAvailable(available,p,piece);
   });
   return available;
 }

 function moveking(piece){
   const available = [
      moveLocal(piece,-1,1), 
      moveLocal(piece,0,1), 
      moveLocal(piece,1,1), 
      moveLocal(piece,1,0), 
      moveLocal(piece,1,-1), 
      moveLocal(piece,0,-1), 
      moveLocal(piece,-1,-1), 
      moveLocal(piece,-1,0)
   ];
   pieces.forEach(p=>{
      clearAvailable(available,p,piece);
   });
   return available;
 }

 const squares = [[]];
 class square{
    constructor(x,y){
       this.pos = [x,y];
       this.geo = new geo("square"+x+y);
       this.mesh = new mesh("square"+x+y);
       this.mesh.ob = this;
       this.mesh.texindex = 0;
       const t = [x - 3.5, BOARDOFFSET, y - 3.5];
       this.mesh.translate(...t);
       this.geo.vertices.push(-.5,0,-.5, .5,0,-.5, .5,0,.5, -.5,0,.5);
       this.geo.normals.push(0,1,0, 0,1,0, 0,1,0, 0,1,0);
       x = x-4;
       y = y-4;
       this.geo.texcoors.push(...[x,y, x+1,y, x+1,y+1, x,y+1].map(e=>{return (e+4)/8;}));
       this.geo.indices.push(0,1,2, 0,2,3);
       this.geo.length = 4*3;
       if(!squares[this.pos[0]]){
         squares[this.pos[0]] = [];
       }
       squares[this.pos[0]][this.pos[1]] = this;
    }
 }

 function spawnPieces(){
    for(let i=0; i<8; i++){
       new piece("pawn","black",i,1);
    }
    new piece("rook","black",0,0);
    new piece("rook","black",7,0);
    new piece("knight","black",1,0);
    new piece("knight","black",6,0);
    new piece("bishop","black",2,0);
    new piece("bishop","black",5,0);
    new piece("queen","black",3,0);
    new piece("king","black",4,0);
    pieces.forEach(p=>{
       new piece(p.type, "white", p.pos[0], (p.pos[1])?6:7);
    });
 }