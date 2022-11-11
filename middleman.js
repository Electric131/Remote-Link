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

wss.on('connection', function (ws) {
    const id = setInterval(function () {
    // ws.send(JSON.stringify(process.memoryUsage()), function () {
    //   //
    //   // Ignoring errors.
    //   //
    // });
    }, 100);
    console.log('started client interval');

    ws.on('close', function () {
        console.log('stopping client interval');
        clearInterval(id);
    });

    ws.on('message', function(messageString) {
        const message =JSON.parse(messageString)
        console.log(message)
    });
});

server.listen(8080, function () {
  console.log('Listening on http://0.0.0.0:8080');
});