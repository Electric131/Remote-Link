const roomID = prompt("Enter the room ID")
const roomPassword = prompt("Enter the room password")
connect()

var eventList = []
var moveMouse = {}
var lastMouse = {x: 0.5, y: 0.5}
var downKeys = []
var countWithoutMessages = 0
var killed = false
var mouseMode = "normal"
var lastImage = ""

var lastMsg = Date.now()

function scale (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function checkValidEvent() {
    if (lastMouse.x >= 0 && lastMouse.x <= 1 && lastMouse.y >= 0 && lastMouse.y <= 1) {
        return true
    }
    return false
}

function styleButton(button) {
    button.style.position = "absolute"
    button.style.scale = "2"
    button.style.zIndex = "-1"
    button.style.tabIndex = "-1"
    button.style.unselectable = "on"
    return button
}

document.ondragstart = function(e) { return false }
document.oncontextmenu = function(e) { return false }
document.onmousemove = function(e) {
    var coords = {x: e.clientX, y: e.clientY}
    var img = document.querySelector("body > img")
    if (img) {
        var newX = scale(coords.x - img.x, 0, img.width, 0, 1)
        var newY = scale(coords.y - img.y, 0, img.height, 0, 1)
        if (mouseMode == "normal" && newX >= 0 && newX <= 1 && newY >= 0 && newY <= 1) {
            moveMouse = {x: newX, y: newY}
        }else if (mouseMode == "firstperson" && newX >= 0 && newX <= 1 && newY >= 0 && newY <= 1) {
            moveMouse = {x: (newX - lastMouse.x) * 50 + 0.5, y: (newY - lastMouse.y) * 50 + 0.5}
        }
        lastMouse = {x: newX, y: newY}
    }
}
document.onmousedown = function(e) { if (!checkValidEvent()) { return }; eventList.push({type: "mouse", action: "down", extra: e.which}) }
document.onmouseup = function(e) { if (!checkValidEvent()) { return }; eventList.push({type: "mouse", action: "up", extra: e.which}) }
document.onkeydown = function(e) {
    if (!(e.key in downKeys)) {
        eventList.push({type: "key", action: "down", extra: e.key})
        downKeys.push(e.key)
    }
}
document.onkeyup = function(e) { eventList.push({type: "key", action: "up", extra: e.key}) }

function connect() {

    const websocket = new WebSocket("wss://remote-connections-klmik.ondigitalocean.app/room/" + roomID + "/" + roomPassword);

    websocket.onopen = (event) => {
        setInterval(function(e) {
            countWithoutMessages++
            if (countWithoutMessages > 50 && !killed) {
                document.body.innerHTML = `<h1>Server has stopped responding temporarily</h1>`
            }
            if (websocket.readyState == WebSocket.OPEN) {
                websocket.send(JSON.stringify({mouse: moveMouse, events: eventList, sentAt: Date.now()}))
                eventList = []
                downKeys = []
                document.querySelector("body > img").src = `data:image/png;base64,${lastImage}`
            }
        }, 100)
        websocket.send(JSON.stringify({mouse: moveMouse, events: eventList, sentAt: Date.now()}))
    };

    websocket.onclose = (event) => {
        killed = true
        document.body.innerHTML = `<h1>Server is closed</h1><button>Retry Connection</button>`
        document.querySelector("body > button").onclick = function(e) { document.body.innerHTML = ""; connect() }
    }

    websocket.onmessage = (event) => {
        countWithoutMessages = 0
        var img = document.querySelector("body > img")
        document.head.innerHTML = `<title>Unblockable | UPS: ${(1000 / (Date.now() - lastMsg)).toFixed(1)}</title>`
        lastMsg = Date.now()
        if (!img) {
            document.body.innerHTML = `<img src="data:image/png;base64,${event.data}" />`
            let winBtn = document.createElement("button")
            winBtn.innerHTML = "Windows"
            winBtn = styleButton(winBtn)
            winBtn.id = "windows"
            winBtn.style.top = "15"
            winBtn.style.right = "40"
            winBtn.onclick = function(e) { eventList.push({type: "key", action: "click", extra: "win"}) }
            document.body.appendChild(winBtn);
            let f11Btn = document.createElement("button")
            f11Btn.innerHTML = "F11"
            f11Btn = styleButton(f11Btn)
            f11Btn.id = "f11"
            f11Btn.style.top = "60"
            f11Btn.style.right = "25"
            f11Btn.onclick = function(e) { eventList.push({type: "key", action: "click", extra: "f11"}) }
            document.body.appendChild(f11Btn)
            let firstPersonBtn = document.createElement("button")
            firstPersonBtn.innerHTML = "First Person"
            firstPersonBtn = styleButton(firstPersonBtn)
            firstPersonBtn.id = "firstPerson"
            firstPersonBtn.style.top = "105"
            firstPersonBtn.style.right = "50"
            firstPersonBtn.onclick = function(e) { (mouseMode == "normal") ? mouseMode = "firstperson" : mouseMode = "normal" }
            document.body.appendChild(firstPersonBtn)
            img = document.querySelector("body > img")
            img.style.maxWidth = "100%"
            img.style.maxHeight = "100%"
            img.style.left = "0px"
            img.style.top = "0px"
            img.style.position = "absolute"
        }else {
            lastImage = event.data
        }
    }

    websocket.addEventListener("error", (event) => {
    console.log("WebSocket error: ", event);
    });

}
