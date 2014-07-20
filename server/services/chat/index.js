"use strict";

var proto = require("proto"),
    clone = proto.clone,
    init = proto.init;

var socketServer = require("../../socket-server"),
    onMessage = socketServer.onMessage,
    broadcast = socketServer.broadcast;

var _ = require("lodash");

var ChatService = clone();

init.addMethod([ChatService], function(chat) {
  console.log("Initializing ChatService", chat);
});

onMessage.addMethod([ChatService], function(chat, data, info) {
  broadcast(info.from, data, info.namespace);
});

module.exports.service = ChatService;
