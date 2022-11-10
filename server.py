import asyncio
import websockets

PublicIP = "47.222.105.250"
print("Server running on " + PublicIP)

async def handler(websocket):
    while True:
        try:
            message = await websocket.recv()
        except websockets.ConnectionClosedOK:
            break
        print(message)

async def main():
    async with websockets.serve(handler, PublicIP, 28567):
        await asyncio.Future()
    
if __name__ == "__main__":
    asyncio.run(main())
