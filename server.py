import asyncio
import websockets
import requests
from multiprocessing import Process
import pyautogui
import time
import base64
from io import BytesIO

def sendMessage(socket, message):
    print(socket)
    pass

def screenshots():
    while True:
        img = pyautogui.screenshot()
        buffered = BytesIO()
        img.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        sendMessage(img_str)
        time.sleep((1/1000) * 10000)

async def handler(websocket):
    while True:
        try:
            message = await websocket.recv()
        except websockets.ConnectionClosedOK:
            break
        print(message)

async def main(password):
    print("Finding an open room to connect to...")
    id = requests.get('https://remote-connections-klmik.ondigitalocean.app/newRoom/').text
    print("Hosting room #" + id + " with password: " + password)
    async with websockets.connect("wss://remote-connections-klmik.ondigitalocean.app/room/" + id + "/" + password) as websocket:
        p = Process(target=screenshots, args=(websocket,))
        p.daemon = True
        p.start()
        p.join()
        while True:
            pass

if __name__ == "__main__":
    password = input("Please enter the password to use for the server: ")
    asyncio.run(main(password))
