import asyncio
import websockets
import requests
import threading
import pyautogui
import pydirectinput
import time
import base64
from io import BytesIO
import json

lastMouse = {}
pyautogui.MINIMUM_DURATION = 0.01

def handleEvent(event):
    eventType = event["type"]
    action = event["action"]
    extra = event["extra"]
    if eventType == "mouse":
        clickTypes = ["left", "middle", "right"]
        if action == "down":
            pyautogui.mouseDown(button = clickTypes[extra - 1])
        elif action == "up":
            pyautogui.mouseUp(button = clickTypes[extra - 1])
    elif eventType == "key":
        if action == "down":
            pydirectinput.keyDown(extra)
        elif action == "up":
            pydirectinput.keyUp(extra)

async def start(id, password):
    global lastMouse
    async with websockets.connect("wss://remote-connections-klmik.ondigitalocean.app/room/" + id + "/" + password) as websocket:
        while True:
            try:
                message = json.loads(await websocket.recv())
                screenSize = pyautogui.size()
                if lastMouse != message["mouse"] and "x" in message["mouse"] and "y" in message["mouse"]:
                    newCoords = {"x": message["mouse"]["x"] * screenSize.width, "y": message["mouse"]["y"] * screenSize.height}
                    pyautogui.moveTo(newCoords["x"], newCoords["y"], pyautogui.MINIMUM_DURATION)
                for event in message["events"]:
                    handleEvent(event)
                lastMouse = message["mouse"]
                img = pyautogui.screenshot()
                buffered = BytesIO()
                img.save(buffered, format="JPEG")
                img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
                await websocket.send("img64=" + img_str)
            except Exception as error:
                raise(error)
                continue

if __name__ == "__main__":
    password = input("Please enter the password to use for the server: ")
    print("Finding an open room to connect to...")
    id = requests.get('https://remote-connections-klmik.ondigitalocean.app/newRoom/').text
    print("Hosting room #" + id + " with password: " + password)
    asyncio.run(start(id, password))
