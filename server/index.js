"use strict";

var clone = require("proto").clone;

var webServer = require("./web-server");

var config = require("config");

var join = require("path").join;

var staticDir = join(__dirname, "/../dist");

var web = clone(webServer.WebServer, {
  sessionSecret: "omgsupersecretlol",
  staticDir: staticDir
});

var services = {
  chatService: clone(require("./services/chat").service, "chat")
};

var echoService;

if (config.env !== "production") {
  // Pieces together stack traces for promises. Has a performance hit.
  require("q").longStackSupport = true;
  services.echoService = clone(require("./services/echo").service, "echo");
}

clone(require("./socket-server").SocketServer, web.http, {
  prefix: "/ws",
  services: services 
});

module.exports = function(port) {
  webServer.listen(web, port || 8080);
};
