"use strict";

var socketServer = require("../../../socket-server"),
    reply = socketServer.reply,
    send = socketServer.send,
    reject = socketServer.reject;

var _ = require("lodash");

function serializeRoom(room) {
  return {
    key: room.key,
    name: room.name,
    description: room.description,
    logo: room.logo,
    users: _.map(room.users, function(user) { return _.pick(user, ["name", "key", "peerId"]); }),
    userCount: (room.users||[]).length
  };
}

var MAX_ROOM_NAME_LENGTH = 200;

module.exports = {
  join: function(roomService, data, req) {
    var user = req.from;
    if (data.key.length > MAX_ROOM_NAME_LENGTH) {
      return reject(req, {msg: "Room name too long"});
    }
    if (!roomService.rooms[data.key]) {
      roomService.rooms[data.key] = {
        key: data.key,
        name: data.key,
        description: "",
        logo: "",
        maxId: 0,
        users: [],
        bans: []
      };
      console.log("Room created: ", data.key);
    }
    var room = roomService.rooms[data.key];
    if (_.contains(room.bans, req.from.fingerprint)) {
      return reject(req, {msg: "You are banned."});
    }
    req.from.name = "boringname-"+(++room.maxId);
    req.from.peerId = data.peerId;
    req.from.room = room;
    _.forEach(room.users, function(user) {
      send(user, {type: "join", data: _.pick(req.from, ["name", "key", "peerId"])}, "room");
    });
    room.users.push(req.from);
    req.from.on("close", function() {
      if (req.from.room === room) {
        room.users = _.without(room.users, req.from);
        _.forEach(room.users, function(user) {
          send(user, {type: "part", data: _.pick(req.from, ["name", "key", "peerId"])}, "room");
        });
      }
    });
    return reply(req, {
      room: serializeRoom(room),
      userName: req.from.name
    });
  },
  list: function(roomService, data, req) {
    reply(req, _.map(roomService.rooms, serializeRoom));
  }
};
