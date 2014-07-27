"use strict";

var proto = require("proto"),
    clone = proto.clone,
    init = proto.init;

var SocketServer = require("../../socket-server"),
    send = SocketServer.send;

var EchoService = clone();

init.addMethod([EchoService], function(chat) {
  console.log("Initializing EchoService", chat);
});

function installService(echoService, namespace, socketServer) {
  socketServer.requests.filter(function(msg) {
    return msg.namespace === namespace;
  }).onValue(function(msg) {
    send(msg.from, msg.data, namespace);
  });
}

module.exports = function(namespace) {
  return function(socketServer) {
    return installService(clone(EchoService), namespace, socketServer);
  };
};
