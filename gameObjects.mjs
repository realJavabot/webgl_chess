import { mesh } from "./mesh.mjs";
import { geo, geoParams } from "./geometry.mjs";
import { Tween, Bezier, Path } from "./animation.mjs";
import * as vecMath from "./math.mjs";
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
       
       this.firstMove = true;

       this.mesh.ob = this;
       this.mesh.texindex = (this.color == "white")? 1 : 2;
       this.path = false;
       this.tween = false;
       this.bezier = this.type == "knight";

       pieces.push(this);
    }

    moveTo(x,y){
      if(this.firstMove){
         this.firstMove = false;
      }
      
      if(this.bezier){
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
         const newmove = new move(this, [...pos]);
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
       this.mesh.ob = 0;
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
    constructor(piece, pos, attacking, to){
      this.to = to;
      this.pos = pos;
      this.attacking = (attacking)? attacking : pieces.find(p => vecMath.same2D(...p.pos, ...pos));
      this.piece = piece;
    }
    remove(){
       if(this.to){
          this.to.remove();
       }
       this.pos = [-1,-1];
    }
    perform(){
      if(this.attacking){this.attacking.delete();}
      this.piece.moveTo(...this.pos);
    }
 }

 class castle extends move{ 
   constructor(king, rook){
     const dir = Math.sign(rook.pos[0] - king.pos[0]);
     super(king, [king.pos[0] + dir * 2, king.pos[1]]);
     this.dir = dir;
     this.king = king;
     this.rook = rook;
   }
   perform(){
      this.king.moveTo(...this.pos);
      this.rook.bezier = true;
      this.rook.moveTo(this.pos[0] - this.dir, this.pos[1]);
      this.rook.bezier = false;
   }
 }

 class pawnJump extends move{
    constructor(piece, pos){
       super(piece, pos);
    }
    perform(){
       super.perform();
       this.piece.enpassant = true;
    }
 }

 function clearAvailable(available, to_p, from_p){
   available.forEach(mov=>{
      if(vecMath.same2D(...to_p.pos, ...mov.pos)){
         if(to_p.color == from_p.color || (from_p.type == "pawn" && from_p.pos[0] == to_p.pos[0])){
            mov.remove()
         }else if(mov.to){
            mov.to.remove();
         }
      }
   });
 }

 function movepawn(pawn){
   const pos = pawn.pos;
   const dir = (pawn.color == "white")? -1 :  1;
   const available = [new move(pawn,[pos[0],pos[1]+1*dir])];
   if(pawn.firstMove){
      const secondMove = new pawnJump(pawn,[pos[0],pos[1]+2*dir]);
      available[0].to = secondMove;
      available.push(secondMove);
   }
   pieces.forEach(p=>{
      clearAvailable(available,p,pawn);
      if( p.color != pawn.color){
         // take diagnoal piece
         if( vecMath.same2D(...p.pos, ...vecMath.add(pos, [-1,dir])) 
          || vecMath.same2D(...p.pos, ...vecMath.add(pos, [ 1,dir]))){
            available.push(new move(pawn, p.pos, p));
         }
         // enpassant
         if(p.enpassant && 
            ( vecMath.same2D(...p.pos, ...vecMath.add(pos, [ 1,0])) 
           || vecMath.same2D(...p.pos, ...vecMath.add(pos, [-1,0])))){
            available.push(new move(pawn, vecMath.add(p.pos, [0,dir]), p));
         }
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
      return new move(p, [p.pos[0]+x,p.pos[1]+y]);
   }
   return new move(p, [-1,-1]);
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
   const range = (a, b) => Array.from(Array(Math.abs(a-b)+1).keys(), k => k + Math.min(a,b));

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

   if(piece.firstMove){
      pieces
         .filter(p => p.type == "rook" && p.color == piece.color && p.firstMove)
         .forEach(rook=>{
            let blocked = false;
            let dir = Math.sign(rook.pos[0] - piece.pos[0]);
            range(piece.pos[0] + 1*dir, rook.pos[0] - 1*dir).forEach(x => {
               blocked |= pieces.some(p => {return p.pos[0] == x && p.pos[1] == piece.pos[1]});
            });
            if(!blocked){
               available.push(new castle(piece, rook));
            }
         });
   }

   pieces.forEach(p=>{
      clearAvailable(available,p,piece);
   });
   return available;
 }

 const squares = [[]];
 let square_params = {
    vertices: new Float32Array([-.5,0,-.5, .5,0,-.5, .5,0,.5, -.5,0,.5]),
    normals: new Float32Array([0,1,0, 0,1,0, 0,1,0, 0,1,0]),
    indices: new Uint16Array([0,1,2, 0,2,3])
   };
 class square{
    constructor(x,y){
       this.pos = [x,y];

       const offx = x-4;
       const offy = y-4;

       // a bit janky, but the engine compares the individual buffers for optimization
       // so reusing as many buffers as possible if beneficial
       this.geometry = new geo(
         "square"+x+y,
         new geoParams([],[offx,offy, offx+1,offy, offx+1,offy+1, offx,offy+1].map(e=>{return (e+4)/8;}))
       );

       this.geometry.vertices = square_params.vertices;
       this.geometry.normals = square_params.normals;
       this.geometry.indices = square_params.indices;

       this.mesh = new mesh("square"+x+y);
       this.mesh.ob = this;
       this.mesh.texindex = 0;
       this.mesh.translate(x - 3.5, BOARDOFFSET, y - 3.5);
       
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