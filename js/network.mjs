let socket;

export function setupNetworking(){
    socket = new WebSocket('ws://localhost:8001/');
    socket.addEventListener("message", ({data}) => {
        const event = JSON.parse(data);
        switch(event.type){
            case 'gen_room_finish': document.getElementById("overlay").style.display = "none"; break;
            default: console.log("strange event: ", data);
        }
    });
}

export function generateRoom(){
    socket.send(JSON.stringify({type: "gen_room"}));
}