"use strict";

var clone = require("proto").clone;

var webServer = require("./web-server");

var config = require("config");

var join = require("path").join;

var staticDir = join(__dirname, "/../dist");

var PeerServer = require("peer").PeerServer;

var web = clone(webServer.WebServer, {
  sessionSecret: "omgsupersecretlol",
  staticDir: staticDir
});

var services = {
  room: clone(require("./services/room").service, "room")
};

var echoService;

if (config.env !== "production") {
  // Pieces together stack traces for promises. Has a performance hit.
  require("q").longStackSupport = true;
  services.echo = clone(require("./services/echo").service, "echo");
}

clone(require("./socket-server").SocketServer, web.http, {
  prefix: "/ws",
  services: services 
});

module.exports = function(port) {
  webServer.listen(web, port || 8080);
  var peerServer = new PeerServer(config.app.peerServerOpts);
  peerServer.on("connection", function(id) {
    console.log("Peer connected: ", id);
  });
  peerServer.on("disconnect", function(id) {
    console.log("Peer disconnected: ", id);
  });
};
