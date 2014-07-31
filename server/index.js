"use strict";

var clone = require("proto").clone;

var webServer = require("./web-server");

var config = require("config");

var join = require("path").join;

var staticDir = join(__dirname, "/../dist");

var _ = require("lodash");

var web = clone(webServer.WebServer, {
  sessionSecret: "omgsupersecretlol",
  staticDir: staticDir
});

var services = {
  room: require("./services/room")("room")
};

var echoService;

if (config.env !== "production") {
  // Pieces together stack traces for promises. Has a performance hit.
  require("q").longStackSupport = true;
  services.echo = require("./services/echo")("echo");
}

module.exports = function(port) {
  webServer.listen(web, port || 8080);
  var socketServer = clone(require("./socket-server").SocketServer, web.http, {
    prefix: "/ws",
    services: services
  });

  _.forEach(services, function(service) {
    socketServer.use(service);
  });
};
