const roomID = prompt("Enter the room ID")
const roomPassword = prompt("Enter the room password")
const websocket = new WebSocket("wss://remote-connections-klmik.ondigitalocean.app/room/" + roomID + "/" + roomPassword);

var moveMouse = {}

websocket.onopen = (event) => {
    setInterval(function(e) {
        if (websocket.readyState == WebSocket.OPEN) {
            websocket.send(JSON.stringify({mouse: moveMouse}))
        }
    }, 100)
};

websocket.onmessage = (event) => {
    document.body.innerHTML = `<img src="data:image/png;base64,${event.data}" />`
    document.querySelector("body > img").style.maxWidth = "100%"
    document.querySelector("body > img").style.maxHeight = "100%"
    function scale (number, inMin, inMax, outMin, outMax) {
        return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }
    document.onmousemove = function(e) {
        var coords = {x: e.clientX, y: e.clientY}
        var img = document.querySelector("body > img")
        moveMouse = {x: scale(coords.x - img.x, 0, img.width, 0, 1), y: scale(coords.y - img.y, 0, img.height, 0, 1)}
    }
}

websocket.addEventListener("error", (event) => {
  console.log("WebSocket error: ", event);
});
