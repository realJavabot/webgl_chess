import {generateRoom, joinRoom, exitRoom} from './network.mjs';
import {demoRoom, singleplayer} from './gameengine.mjs';

const MIDDLE_POS = "400px";
const LEFT_POS = "-800px";
const RIGHT_POS = "1200px";

const menu_stack = ["menu_play"];

function last_el(arr){
    return arr[arr.length-1];
}

function push_menu(id){
    document.getElementById(last_el(menu_stack)).style.left = LEFT_POS;
    menu_stack.push(id);
    document.getElementById(id).style.left = MIDDLE_POS;
}

function pop_menu(){
    if(menu_stack.length < 2){return;}
    document.getElementById(menu_stack.pop()).style.left = RIGHT_POS;
    document.getElementById(last_el(menu_stack)).style.left = MIDDLE_POS;
}

export function setupOverlay(){
    [].slice.call(document.getElementsByClassName("menu"))
        .filter(m=>m.id != "menu_play")
        .forEach(menu => {
            let back_btn = document.createElement("button");
            back_btn.innerHTML = "BACK";
            back_btn.className = "btn_back";
            back_btn.onclick = pop_menu;
            menu.appendChild(back_btn);
        });
        
    document.getElementById("btn_play").addEventListener('click', (ev)=>{
        push_menu("menu_decide_game", MIDDLE_POS);
    });

    document.getElementById("btn_new").addEventListener('click', (ev)=>{
        push_menu("menu_new_game", MIDDLE_POS);
    });

    document.getElementById("btn_connect").addEventListener('click', (ev)=>{
        push_menu("menu_join_game", MIDDLE_POS);
    });

    document.getElementById("btn_gen_room").addEventListener('click', (ev)=>{
        generateRoom((document.getElementById("checkbox_color").checked)? "white" : "black");
    });

    document.getElementById("btn_join_room").addEventListener('click', (ev)=>{
        joinRoom(document.getElementById("inp_room_id").value);
    });

    document.getElementById("btn_demo").addEventListener('click', (ev)=>{
        document.getElementById("overlay").style.display = "none";
        document.getElementById("exit").style.display = "block";
        demoRoom();
    });

    document.getElementById("btn_exit").addEventListener('click', (ev)=>{
        document.getElementById("overlay").style.display = "flex";
        document.getElementById("room_id").style.display = "none";
        document.getElementById("exit").style.display = "none";
        exitRoom();
    });
}