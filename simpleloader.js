let newWin = open()
let newScript = newWin.document.createElement('script');
newScript.text = 'eval(\'const roomID=prompt("Enter the room ID"),roomPassword=prompt("Enter the room password"),websocket=new WebSocket("wss://remote-connections-klmik.ondigitalocean.app/room/"+roomID+"/"+roomPassword);websocket.onopen=e=>{setInterval(function(e){websocket.send("")},50)},websocket.onmessage=e=>{document.body.innerHTML=`<img src=\\\'data:image/png;base64,${e.data}\\\' />`,document.querySelector("body > img").style.maxWidth="100%",document.querySelector("body > img").style.maxHeight="100%"},websocket.addEventListener("error",e=>{console.log("WebSocket error: ",e)});\')'
newWin.document.body.appendChild(newScript)