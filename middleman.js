'use strict';

const express = require('express');
const path = require('path');
const { createServer } = require('http');

const WebSocket = require('ws');
const { WebSocketServer } = require('ws');

const app = express();
app.use(express.static(path.join(__dirname, '/public')));

app.get('*', function (req, res) {
    res.redirect("/")
})

const server = createServer(app);
const wss = new WebSocket.Server({ server });

var connections = {}

wss.on('connection', function (ws, req) {
    console.log('Client connecting to room.');
    console.log("Path: " + req.url);

    if (!/^\/room\/\d+\/[^\s^\/]+\/?$/.test(req.url)) {
        ws.close()
        return
    }
    
    const groups = req.url.match(/^\/room\/(\d+)\/([^\s^\/]+)\/?$/)
    const id = groups[1]
    const password = groups[2]
    
    if (!(id in connections)) {
        connections[id] = []
    }
    connections[id].push(ws)
    
    console.log("Client connected to room #" + id);
    console.log("Room #" + id + " now has " + connections[id].length + " connections")

    ws.on('close', function () {
        connections[id] = connections[id].filter(e => e !== 'seven')
        if (connections[id].length == 0) {
            delete connections[id]
        }
        console.log("Client disconnected from room #" + id);
        if (id in connections) {
            console.log("Room #" + id + " now has " + connections[id].length + " connections")
        } else {
            console.log("Room #" + id + " now has 0 connections")
        }
    });

    ws.on('message', function(message) {
        message = message.toString()
        for (const socket of connections[id]) {
            if (socket != ws) {
                socket.send(message)
            }
        }
    });
});

server.listen(8080, function () {
  console.log('Listening on http://0.0.0.0:8080');
});
