import asyncio
import websockets

async def handler(websocket):
    while True:
        try:
            message = await websocket.recv()
        except websockets.ConnectionClosedOK:
            break
        print(message)

async def main():
    async with websockets.connect("wss://remote-connections-klmik.ondigitalocean.app") as websocket:
        while True:
            print(await websocket.recv())
    
if __name__ == "__main__":
    asyncio.run(main())
