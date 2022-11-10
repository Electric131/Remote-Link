const websocket = new WebSocket("ws://47.222.105.250:28567");
websocket.onopen = (event) => {
    websocket.send("Here's some text that the server is urgently awaiting!");
};

websocket.addEventListener('error', (event) => {
  console.log('WebSocket error: ', event);
});
