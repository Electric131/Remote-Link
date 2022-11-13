'use strict';

const express = require('express');
const path = require('path');
const { createServer } = require('http');

const WebSocket = require('ws');
const { WebSocketServer } = require('ws');

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
            if (Object.keys(rooms[id]) == 0) {
                delete rooms[id]
            }
        }, 10000, nextRoom.toString())
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
        ws.close()
        return
    }
    
    if (Object.keys(rooms[id]).length == 0) {
        rooms[id].password = password
        rooms[id].host = ws
    }
    
    if (!(id in connections)) {
        connections[id] = []
    }
    connections[id].push({socket: ws, valid: password == rooms[id].password})

    ws.on('close', function () {
        connections[id] = connections[id].filter(socketData => socketData.socket !== ws)
        if (connections[id].length == 0) {
            delete connections[id]
        }
        if (id in rooms && ws == rooms[id].host) {
            delete rooms[id]
            for (const socketData of connections[id]) {
                socketData.socket.close()
            }
        }
    });

    ws.on('message', function(message) {
        message = message.toString()
        for (const socketData of connections[id]) {
            if (socketData.socket != ws && socketData.valid) {
                socketData.socket.send(message)
            }
        }
    });
});

server.listen(8080, function () {
  console.log('Listening on http://0.0.0.0:8080');
});
