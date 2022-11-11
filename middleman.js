'use strict';

const express = require('express');
const path = require('path');
const { createServer } = require('http');

const WebSocket = require('ws');

const app = express();
app.use(express.static(path.join(__dirname, '/public')));

app.get('*', function (req, res) {
    res.redirect("/")
})

const server = createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', function (ws, req) {
    const id = setInterval(function () {
    // ws.send(JSON.stringify(process.memoryUsage()), function () {
    //   //
    //   // Ignoring errors.
    //   //
    // });
    }, 100);
    console.log('started client interval');
    console.log(req.url)

    ws.on('close', function () {
        console.log('stopping client interval');
        clearInterval(id);
    });

    ws.on('message', function(message) {
        message = message.toString()
        console.log(message)
        console.log(req.url)
    });
});

server.listen(8080, function () {
  console.log('Listening on http://0.0.0.0:8080');
});