import {move, pieces, resetBoard} from '/webgl_chess/js/gameObjects.mjs';
import {camera, singleplayer_false} from '/webgl_chess/js/gameengine.mjs';
import {IP, PORT} from '/webgl_chess/js/constants.mjs';
let socket;

export function setupNetworking(){
    socket = new WebSocket(`wss://${IP}:${PORT}/`);
    socket.addEventListener('message', ({data}) => {
        const event = JSON.parse(data);
        console.log(event);
        switch(event.type){
            case 'gen_room_finish': setupRoom(event.value, event.color); break;
            case 'piece_moved': movePieceLocal(event.move); break;
            case 'error': displayError(event.message); break;
            case 'message': displayError(event.message); break;
            default: console.log('strange event: ', data);
        }
    });
}

export function generateRoom(color){
    socket.send(JSON.stringify({type: 'gen_room', color}));
}

export function joinRoom(room_id){
    socket.send(JSON.stringify({type: 'join_room', room_id}));
}

export function movePiece(from, to){
    socket.send(JSON.stringify({type: 'move_piece', move: {from,to}}));
}

function movePieceLocal({from,to}){
    const piece = pieces.find(p => p.pos[0] == from[0] && p.pos[1] == from[1]);
    const attacking = pieces.find(p => p.pos[0] == to[0] && p.pos[1] == to[1]);
    new move(piece, to, attacking).perform();
}

let error_displayed = false;
function displayError(message){
    const error_alert = document.getElementById('error_alert');
    error_alert.innerText = message;
    error_alert.style.display = 'block';
    if(!error_displayed){
        error_displayed = true;
        setTimeout(()=>{
            error_alert.style.display = 'none';
            error_displayed = false;
        }, 3000);
    }
}

function setupRoom(id, color){
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('room_id').style.display = 'block';
    document.getElementById('exit').style.display = 'block';
    document.getElementById('room_id').innerText = `Room ID: ${id}`;

    if(color == 'black'){
        camera.setOrbitRotation(Math.PI,1.1);
    }else{
        camera.setOrbitRotation(0,1.1);
    }
}

export function exitRoom(){
    socket.send(JSON.stringify({type: 'exit_room'}));
    singleplayer_false();
    resetBoard();
}   