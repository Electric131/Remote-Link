'use strict';

const express = require('express');
const busboy = require('connect-busboy');
const fileUpload = require("express-fileupload");
const path = require('path');
const { createServer } = require('http');
const fs = require('fs');

const WebSocket = require('ws');

const app = express();
app.use(express.static(path.join(__dirname, '/public')));
app.use(fileUpload());
app.use(busboy());

var connections = {}
var rooms = {}
var tempfiles = {}

var ready = false
if (fs.existsSync("./public/downloaded-files")){
    fs.rm("./public/downloaded-files", { recursive: true }, e => { fs.mkdirSync("./public/downloaded-files"); })
} else {
    fs.mkdirSync("./public/downloaded-files");
}

function renderPage(path, vars = {}) {
    return new Promise((res, rej) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) { console.log(err) }
            // /\${{(\S+)}}/gm.matchAll(data)
            let matches = data.matchAll(/\${{(\S+)}}/gm)
            for (const match of matches) {
                data = data.replace(`$\{{${match[1]}}\}`, vars[match[1]])
            }
            res(data)
        })
    })
}

app.all('*', function (req, res) {
    const allowed = [
        {type: "path", id: "uploadfile", names: ["uploadfile", "uploadfile.html"]},
        {type: "path", id: "upload", names: ["upload"]},
        {type: "input", id: "uploads-file", names: ["uploads"]},
        {type: "path", id: "uploads-view", names: ["uploads"]}
    ]
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
    let passed = []
    let inputs = {}
    allowed.map(e => {
        switch(e.type) {
            case "path":
                for (const name of e.names) {
                    let pathregex = new RegExp(`^\/${name}\/?(\\?[=\\S]+)?$`, 'g')
                    if (pathregex.test(req.url)) {
                        passed.push(e.id)
                        break
                    }
                }
                break
            case "input":
                for (const name of e.names) {
                    let pathregex = new RegExp(`^\/${name}\/([^\\s+\/]+)\/?$`, 'g')
                    let matches = req.url.matchAll(pathregex)
                    for (const match of matches) {
                        if (!inputs[e.id]) {
                            inputs[e.id] = []
                        }
                        inputs[e.id].push(match[1])
                    }
                    if (inputs[e.id]) {
                        passed.push(e.id)
                    }
                    break
                }
                break
            default:
                break
        }
    })
    if (passed.includes("uploads-view")) {
        let fileList = ["None"]
        if (Object.keys(tempfiles).length > 0) {
            fileList = []
            for (const filename of Object.keys(tempfiles)) {
                fileList.push(`<a href="/uploads/${filename}">${filename}</a>`)
            }
        }
        renderPage('public/uploads.html', {fileList: fileList}).then(data => {
            res.send(data)
        })
        return
    }
    if (passed.includes("uploads-file") && inputs["uploads-file"]) {
        let file = inputs["uploads-file"]
        if (fs.existsSync("./public/downloaded-files/" + file)) {
            renderPage('public/view-file.html', {finalTime: tempfiles[file], filename: file}).then(data => {
                res.send(data)
            })
        } else {
            res.redirect("/")
        }
        return
    }
    if (passed.includes("uploadfile")) {
        let success = false
        if (req.method == "POST") {
            if (req.files && req.files.filename) {
                let name = req.files.filename.name
                name = name.replaceAll(" ", "-")
                let path = "./public/downloaded-files/" + name
                req.files.filename.mv(path).then(file => {})
                tempfiles[name] = new Date().getTime() + 60000 * 5
                setTimeout(function(filepath){
                    fs.unlink(filepath, err => {})
                }, 60000 * 5, path)
                success = true
                res.redirect("/upload?state=success&filename=" + encodeURIComponent(name))
            }
            // res.download() for downloads after
        }
        if (!success) {
            res.redirect("/upload?state=fail")
        }
        return
    }
    if (passed.includes("upload")) {
        if (req.query && req.query.state) {
            if (req.query.state == "success" && req.query.filename) {
                renderPage('public/upload.html', {header: `File Uploaded Successfully!`, info: `Uploaded as "${req.query.filename}"\nView at: <a href="./uploads/${req.query.filename}">${req.query.filename}</a>`}).then(data => {
                    res.send(data)
                })
            } else {
                renderPage('public/upload.html', {header: `File Upload Failed.`, info: ``}).then(data => {
                    res.send(data)
                })
            }
            return
        }
        renderPage('public/upload.html', {header: ``, info: ``}).then(data => {
            res.send(data)
        })
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
            if (id in connections) {
                for (const socketData of connections[id]) {
                    socketData.socket.close()
                }
            }
        }else {
            console.log("Room #" + id + " > " + "Client has disconnected.")
        }
    });

    ws.on('message', function(message) {
        message = message.toString()
        if (id in rooms && ws != rooms[id].host) {
            rooms[id].host.send(message)
        }else if (connections[id].length > 1) {
            connections[id][1].socket.send(message)
        }
    });
});

server.listen(8080, function () {
  console.log('Listening on http://0.0.0.0:8080');
});
