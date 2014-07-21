"use strict";

var proto = require("proto"),
    clone = proto.clone,
    init = proto.init;

var socketServer = require("../../socket-server"),
    onMessage = socketServer.onMessage,
    broadcast = socketServer.broadcast;

var EchoService = clone();

init.addMethod([EchoService], function(chat) {
  console.log("Initializing EchoService", chat);
});

onMessage.addMethod([EchoService], function(chat, data, info) {
  broadcast(info.from, data, info.namespace);
});

module.exports.service = EchoService;
