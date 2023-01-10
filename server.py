import asyncio
import websockets
import requests
import pyautogui
import pydirectinput
import base64
from io import BytesIO
import json
import time

pyautogui.FAILSAFE = False # Wee woo! Failsafe goes bye bye!!!!
pyautogui.PAUSE = 0 # I. am. **SPEED**.
pydirectinput.PAUSE = 0 # Same speed!
pydirectinput.FAILSAFE = False # Bye bye!

lastMouse = {}
pyautogui.MINIMUM_DURATION = 0.01

def handleEvent(event):
    if not ("type" in event and "action" in event and "extra" in event):
        return False
    eventType = event["type"]
    action = event["action"]
    extra = event["extra"]
    replacements = { "control": "ctrl" }
    print("Handling Event: " + str(event))
    if eventType == "mouse":
        clickTypes = ["left", "middle", "right"]
        if action == "down":
            pyautogui.mouseDown(button = clickTypes[extra - 1])
        elif action == "up":
            pyautogui.mouseUp(button = clickTypes[extra - 1])
    elif eventType == "key":
        if extra.startswith("Arrow"):
            extra = extra.strip("Arrow")
        if extra.lower() in replacements:
            extra = replacements[extra.lower()]
        if action == "down":
            if len(extra.lower()) == 1 and (ord(extra.lower()) in range(33, 48) or ord(extra.lower()) in range(58, 65)):
                pyautogui.keyDown(extra.lower())
            else:
                pydirectinput.keyDown(extra.lower())
        elif action == "up":
            if len(extra.lower()) == 1 and (ord(extra.lower()) in range(33, 48) or ord(extra.lower()) in range(58, 65)):
                pyautogui.keyUp(extra.lower())
            else:
                pydirectinput.keyUp(extra.lower())
        elif action == "click":
            pyautogui.press(extra)

async def start(id, password):
    global lastMouse
    async with websockets.connect("wss://remote-connections-klmik.ondigitalocean.app/room/" + id + "/" + password) as websocket:
        while True:
            try:
                recv = await websocket.recv()
                message = json.loads(recv)
                screenSize = pyautogui.size()
                if "mouse" in message and lastMouse != message["mouse"] and "x" in message["mouse"] and "y" in message["mouse"]:
                    newCoords = {"x": message["mouse"]["x"] * screenSize.width, "y": message["mouse"]["y"] * screenSize.height}
                    pyautogui.moveTo(newCoords["x"], newCoords["y"], pyautogui.MINIMUM_DURATION)
                if "events" in message:
                    for event in message["events"]:
                        handleEvent(event)
                if "mouse" in message:
                    lastMouse = message["mouse"]
                if "sentAt" in message:
                    currentTime = round(time.time() * 1000)
                    timeDiff = int(int(currentTime) - int(message["sentAt"]))
                    # Optional debug to see approximate delay in ms.
                    print("Approximate delay: " + str(str(timeDiff).zfill(4)))
                img = pyautogui.screenshot()
                buffered = BytesIO()
                img.save(buffered, format="JPEG")
                img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
                await websocket.send(img_str)
            except Exception as error:
                print(error)
                break
        print("Attempting reconnect in 60s.")
        time.sleep(60)
        print("Attempting to reconnect...")
        print("Finding an open room to connect to...")
        id = requests.get('https://remote-connections-klmik.ondigitalocean.app/newRoom/').text
        print("Reconnected to room #" + id + " with password: " + password)
        await start(id, password)

if __name__ == "__main__":
    password = input("Please enter the password to use for the server: ")
    print("Finding an open room to connect to...")
    id = requests.get('https://remote-connections-klmik.ondigitalocean.app/newRoom/').text
    print("Hosting room #" + id + " with password: " + password)
    asyncio.run(start(id, password))
