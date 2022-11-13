import asyncio
import websockets
import requests
import threading
import pyautogui
import time
import base64
from io import BytesIO

async def start(id, password):
    async with websockets.connect("wss://remote-connections-klmik.ondigitalocean.app/room/" + id + "/" + password) as websocket:
        while True:
            try:
                message = await websocket.recv()
                img = pyautogui.screenshot()
                buffered = BytesIO()
                img.save(buffered, format="JPEG")
                img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
                await websocket.send(img_str)
            except websockets.ConnectionClosedOK:
                return

if __name__ == "__main__":
    password = input("Please enter the password to use for the server: ")
    print("Finding an open room to connect to...")
    id = requests.get('https://remote-connections-klmik.ondigitalocean.app/newRoom/').text
    print("Hosting room #" + id + " with password: " + password)
    asyncio.run(start(id, password))
