const roomID = prompt("Enter the room ID")
const roomPassword = prompt("Enter the room password")
const websocket = new WebSocket("wss://remote-connections-klmik.ondigitalocean.app/room/" + roomID + "/" + roomPassword);

websocket.onopen = (event) => {
    setInterval(function(e) {
        websocket.send("")
    }, 50)
};

websocket.onmessage = (event) => {
    document.body.innerHTML = `<img src='data:image/png;base64,${event.data}' />`
    document.querySelector("body > img").style.maxWidth = "100%"
    document.querySelector("body > img").style.maxHeight = "100%"
}

websocket.addEventListener('error', (event) => {
  console.log('WebSocket error: ', event);
});
