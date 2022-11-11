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
    console.log('Client connected.');
    console.log("Path: " + req.url);
    console.log("Connected Client Count: " + wss.clients.size);
    console.log("Connected Clients: " + wss.clients.values());

    ws.on('close', function () {
        console.log('Client disconnected.');
    });

    ws.on('message', function(message) {
        message = message.toString()
        // new WebSocketServer({server: server, path: req.url})
        ws.send("Test message!")
        console.log(message)
        console.log(req.url)
    });
});

server.listen(8080, function () {
  console.log('Listening on http://0.0.0.0:8080');
});