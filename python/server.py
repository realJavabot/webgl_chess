#!/usr/bin/env python

import asyncio
import websockets
import secrets
import string
import json

connections=[]

def generate_room(websocket):
    room_id = ''.join(secrets.choice(string.ascii_letters) for i in range(5))
    connections[room_id] = [websocket]
    return {'type': 'gen_room_finish', 'value': room_id};

async def handler(websocket):
    async for message in websocket:
        event = json.loads(message)
        if event["type"] == "gen_room":
            await websocket.send(json.dumps(generate_room(websocket)))
        else:
            print("invalid event: ", message)


async def main():
    async with websockets.serve(handler, "", 8001):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())