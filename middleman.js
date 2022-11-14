'use strict';

const express = require('express');
const path = require('path');
const { createServer } = require('http');

const WebSocket = require('ws');

const app = express();
app.use(express.static(path.join(__dirname, '/public')));

var connections = {}
var rooms = {}

app.all('*', function (req, res) {
    if (req.url == "/newRoom/") {
        var nextRoom = 1
        for (const roomID of Object.keys(rooms)) {
            if (roomID == nextRoom) {
                nextRoom ++;
                continue
            }
            break
        }
        rooms[nextRoom.toString()] = {}
        res.send(nextRoom.toString())
        setTimeout(function(id) {
            if (id in rooms && Object.keys(rooms[id]) == 0) {
                delete rooms[id]
            }
        }, 1000, nextRoom.toString())
        return
    }
    res.redirect("/")
})

const server = createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', function (ws, req) {
    if (!/^\/room\/\d+\/[^\s^\/]+\/?$/.test(req.url)) {
        ws.close()
        return
    }
    
    const groups = req.url.match(/^\/room\/(\d+)\/([^\s^\/]+)\/?$/)
    const id = groups[1]
    const password = groups[2]
    
    if (!(id in rooms)) {
        console.log("Room #" + id + " > " + "Attempt to connect to closed room.")
        ws.close()
        return
    }

    if (!(id in connections)) {
        connections[id] = []
    }
    
    if (Object.keys(rooms[id]).length == 0) {
        console.log("Room #" + id + " > " + "Host has connected.")
        rooms[id].password = password
        rooms[id].host = ws
        connections[id].push({socket: ws, valid: true})
    }else {
        if (password == rooms[id].password && connections[id].length == 1) {
            console.log("Room #" + id + " > " + "Client has connected.")
            connections[id].push({socket: ws, valid: true})
        }else {
            console.log("Room #" + id + " > " + "Login attempt made with invalid password or max connections.")
            ws.close()
        }
    }

    ws.on('close', function () {
        connections[id] = connections[id].filter(socketData => socketData.socket !== ws)
        if (connections[id].length == 0) {
            delete connections[id]
        }
        if (id in rooms && ws == rooms[id].host) {
            console.log("Room #" + id + " > " + "Host has disconnected.")
            delete rooms[id]
            console.log("Room #" + id + " > " + "Closing connected clients.")
            for (const socketData of connections[id]) {
                socketData.socket.close()
            }
        }else {
            console.log("Room #" + id + " > " + "Client has disconnected.")
        }
    });

    ws.on('message', function(message) {
        message = message.toString()
        if (ws != rooms[id].host) {
            rooms[id].host.send(message)
        }else if (connections[id].length > 1) {
            connections[id][1].socket.send(message)
        }
    });
});

server.listen(8080, function () {
  console.log('Listening on http://0.0.0.0:8080');
});
