import asyncio
import websockets
import requests
import threading
import pyautogui
import time
import base64
from io import BytesIO

async def getMessage(websocket):
    while True:
        try:
            message = await websocket.recv()
        except websockets.ConnectionClosedOK:
            return

def listener(websocket):
    print("Starting listener")
    asyncio.run(getMessage(websocket))

async def screenshotter(websocket):
    print("Starting screenshotter")
    while True:
        img = pyautogui.screenshot()
        buffered = BytesIO()
        img.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        sendMessage(img_str)
        time.sleep((1/1000) * 10000)
        await handler(websocket)

async def start(id, password):
    async with websockets.connect("wss://remote-connections-klmik.ondigitalocean.app/room/" + id + "/" + password) as websocket:
        t1 = threading.Thread(target = listener, args =(websocket, ), daemon = True)
        t1.start()
        t1.join()

if __name__ == "__main__":
    password = input("Please enter the password to use for the server: ")
    print("Finding an open room to connect to...")
    id = requests.get('https://remote-connections-klmik.ondigitalocean.app/newRoom/').text
    print("Hosting room #" + id + " with password: " + password)
    asyncio.run(start(id, password))
