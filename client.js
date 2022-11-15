const roomID = prompt("Enter the room ID")
const roomPassword = prompt("Enter the room password")
const websocket = new WebSocket("wss://remote-connections-klmik.ondigitalocean.app/room/" + roomID + "/" + roomPassword);

var eventList = []
var moveMouse = {}
var downKeys = []
var countWithoutMessages = 0

var lastMsg = Date.now()

function scale (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

document.oncontextmenu = function(e) { return false }
document.onmousemove = function(e) {
    var coords = {x: e.clientX, y: e.clientY}
    var img = document.querySelector("body > img")
    if (img) {
        var newX = scale(coords.x - img.x, 0, img.width, 0, 1)
        var newY = scale(coords.y - img.y, 0, img.height, 0, 1)
        if (newX >= 0 && newX <= 1 && newY >= 0 && newY <= 1) {
            moveMouse = {x: newX, y: newY}
        }
    }
}
document.onmousedown = function(e) { eventList.push({type: "mouse", action: "down", extra: e.which}) }
document.onmouseup = function(e) { eventList.push({type: "mouse", action: "up", extra: e.which}) }
document.onkeydown = function(e) {
    if (!(e.key in downKeys)) {
        eventList.push({type: "key", action: "down", extra: e.key})
        downKeys.push(e.key)
    }
}
document.onkeyup = function(e) { eventList.push({type: "key", action: "up", extra: e.key}) }

websocket.onopen = (event) => {
    setInterval(function(e) {
        countWithoutMessages++
        if (countWithoutMessages > 50) {
            document.body.innerHTML = `<h1>Server has stopped responding</h1>`
        }
        if (websocket.readyState == WebSocket.OPEN) {
            websocket.send(JSON.stringify({mouse: moveMouse, events: eventList}))
            eventList = []
            downKeys = []
        }
    }, 1)
};

websocket.onclose = (event) => {
    document.body.innerHTML = `<h1>Server is closed</h1>`
}

websocket.onmessage = (event) => {
    if (event.data.startsWith("img64=")) {
        countWithoutMessages = 0
        var img = document.querySelector("body > img")
        console.log(Date.now() - lastMsg)
        lastMsg = Date.now()
        // if (!img) {
        //     document.body.innerHTML = `<img src="data:image/png;base64,${event.data.split("=")[1]}" />`
        //     document.querySelector("body > img").style.maxWidth = "100%"
        //     document.querySelector("body > img").style.maxHeight = "100%"
        // }else {
        //     img.src = `data:image/png;base64,${event.data.split("=")[1]}`
        // }
    }
}

websocket.addEventListener("error", (event) => {
  console.log("WebSocket error: ", event);
});
