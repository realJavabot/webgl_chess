#!/usr/bin/env python

import asyncio
import websockets
import secrets
import string
import json
import copy
from enum import Enum

class Color(Enum):
    WHITE = 1
    BLACK = 2

rooms = {}

state_init = [
    'bbbbbbbb',
    'bbbbbbbb',
    '00000000',
    '00000000',
    '00000000',
    '00000000',
    'wwwwwwww',
    'wwwwwwww'
]

state = []
for row in state_init:
    new_row = []
    for c in row:
        if c == 'w':
            new_row.append(Color.WHITE)
        elif c == 'b':
            new_row.append(Color.BLACK)
        else:
            new_row.append(None)
    state.append(new_row)

def error(message):
    return {'type': 'error', 'message':message}

def generate_room(websocket, _color):
    if _color not in ['white', 'black']:
        return error('color not valid')
    color = Color.WHITE if _color == 'white' else Color.BLACK

    room_id = ''.join(secrets.choice(string.ascii_letters) for i in range(5))
    room = {Color.BLACK: None, Color.WHITE: None, 'turn': Color.WHITE, 'state': copy.deepcopy(state)}
    room[color] = websocket
    rooms[room_id] = room

    return {'type': 'gen_room_finish', 'value': room_id, 'color': _color}

async def join_room(websocket, room_id):
    if room_id not in rooms:
        return error('room id not valid')

    room = rooms[room_id]

    send_message = lambda c : room[c].send(json.dumps({'type': 'message', 'message': 'Opponent has joined'}))
    color = ''
    if room[Color.BLACK] == None:
        room[Color.BLACK] = websocket
        color = 'black'
        await send_message(Color.WHITE)
    else:
        room[Color.WHITE] = websocket
        color = 'white'
        await send_message(Color.BLACK)
    
    return {'type': 'gen_room_finish', 'value': room_id, 'color': color}

async def send_move(websocket, move):
    for key in rooms:
        room = rooms[key]
        players = [room[Color.BLACK], room[Color.WHITE]]
        if websocket in players:
            if None in players:
                await websocket.send(json.dumps(error('Wait for the other player to connect!')))
                return

            player_color = Color.WHITE if room[Color.WHITE] == websocket else Color.BLACK
            if room['turn'] != player_color:
                await websocket.send(json.dumps(error('Not your turn')))    
            elif room['state'][move['from'][1]][move['from'][0]] != player_color:
                await websocket.send(json.dumps(error('Not your color piece')))    
            else:
                room['turn'] = Color.WHITE if room['turn'] == Color.BLACK else Color.BLACK
                room['state'][move['from'][1]][move['from'][0]] = None
                room['state'][move['to'][1]][move['to'][0]] = player_color
                for p in players:
                    await p.send(json.dumps({'type': 'piece_moved', 'move': move}))

async def player_disconnected(websocket):
    for key in rooms:
        room = rooms[key]
        players = [room[Color.BLACK], room[Color.WHITE]]
        if websocket in players:
            for p in players:
                if p == websocket:
                    if room[Color.BLACK] == websocket:
                        room[Color.BLACK] = None
                    if room[Color.WHITE] == websocket:
                        room[Color.WHITE] = None
                    if room[Color.WHITE] == room[Color.BLACK]:
                        del rooms[key]
                    continue
                try:
                    await p.send(json.dumps(error('opponent disconnected')))
                except:
                    print('disconnected')
            break

async def handler(websocket):
    while True:
        try:
            message = await websocket.recv()
        except websockets.ConnectionClosedOK:
            await player_disconnected(websocket)
            break

        event = json.loads(message)
        if event['type'] == 'gen_room':
            await websocket.send(json.dumps(generate_room(websocket, event['color'])))
        elif event['type'] == 'join_room':
            await websocket.send(json.dumps(await join_room(websocket, event['room_id'])))
        elif event['type'] == 'move_piece':
            await send_move(websocket, event['move'])
        elif event['type'] == 'exit_room':
            await player_disconnected(websocket)
        else:
            print('invalid event: ', message)


async def main():
    async with websockets.serve(handler, '10.0.0.221', 8001):
        await asyncio.Future()  # run forever


if __name__ == '__main__':
    asyncio.run(main())