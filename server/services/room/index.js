"use strict";

var proto = require("proto"),
    clone = proto.clone,
    init = proto.init;

var socketServer = require("../../socket-server"),
    onMessage = socketServer.onMessage,
    onRequest = socketServer.onRequest,
    reply = socketServer.reply,
    reject = socketServer.reject,
    broadcast = socketServer.broadcast;

var _ = require("lodash");

var resources = {
  room: require("./resources/room")
};

var RoomService = clone();

init.addMethod([RoomService], function(room) {
  console.log("Initializing RoomService", room);
  room.rooms = {};
});

onMessage.addMethod([RoomService], function(room, data, info) {
  broadcast(info.from, data, info.namespace);
});

onRequest.addMethod([RoomService], function(room, data, req) {
  try {
    return resources[data.resource][data.method](room, data, req);
  } catch (e) {
    console.error("Error while processing request: ", e, req);
    return reject(req, {message: "nope"});
  }
});

module.exports.service = RoomService;
