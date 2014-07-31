"use strict";

var proto = require("proto"),
    clone = proto.clone,
    init = proto.init;

var Genfun = require("genfun");

var SocketServer = require("../../socket-server"),
    send = SocketServer.send,
    reply = SocketServer.reply,
    reject = SocketServer.reject;

var _ = require("lodash");

var Bacon = require("baconjs");

var serialize = new Genfun();
serialize.addMethod([], function(data) {
  return (data && typeof data === "object") ? _.mapValues(data, serialize) : data;
});
serialize.addMethod([Array.prototype], function(arr) {
  return _.map(arr, serialize);
});

var RoomService = clone({
  MAX_ROOM_NAME_LENGTH: 200
});

var Room = clone();
init.addMethod([Room], function(room, key) {
  _.extend(room, {
    key: key,
    maxId: 0,
    users: [],
    bans: []
  });
  console.log("Room created:", key);
});

serialize.addMethod([Room], function(room) {
  return _.mapValues(_.pick(room, ["key", "users"]), serialize);
});

var User = clone();
init.addMethod([User], function(user, opts) {
  _.extend(user, opts);
});

serialize.addMethod([User], function(user) {
  return serialize(_.pick(user, ["name", "peerId", "audioAvailable", "videoAvailable"]));
});

function installService(roomService, namespace, socketServer) {
  roomService.namespace = namespace;
  roomService.socketServer = socketServer;
  roomService.rooms = {};
  roomService.requests = socketServer.requests.filter(function(msg) {
    return msg.namespace === namespace;
  });
  roomService.messages = socketServer.messages.filter(function(msg) {
    return msg.namespace === namespace;
  });
  
  // TODO - move these out
  roomService.joins = filterCommand(roomService.requests, "join").map(function(req) {
    var data = req.data;
    if (data.key.length > roomService.MAX_ROOM_NAME_LENGTH) {
      return {req: req, accepted: false, reason: "Room name too long"};
    }
    
    if (!roomService.rooms[data.key]) {
      roomService.rooms[data.key] = clone(Room, data.key);
    }
    
    var room = roomService.rooms[data.key];
    var user = clone(User, {
      name: "boringname-"+(++room.maxId),
      peerId: data.peerId,
      conn: req.from,
      room: room,
      ready: false,
      audioAvailable: true,
      videoAvailable: true,
      fingerprint: req.from.fingerprint
    });
    room.users.push(user);
    req.from.user = user;
    req.from.rooms = _.union(req.from.rooms||[], [room]);
    if (isUserBanned(user, room)) {
      return {req: req, accepted: false, reason: "Connections from you are banned"};
    }
    return {req: req, user: user, room: room, accepted: true};
  });
  roomService.joins.onValue(respondToCommand);
  roomService.joins.onValue(function(res) {
    if (res.accepted) {
      broadcastToOthers(roomService, res.user, "join", res.user);
    }
  });
  
  roomService.parts = socketServer.disconnects.map(function(conn) {
    return _.map(conn.rooms||[], function(room) {
      return {
        room: room,
        user: _.find(room.users, {conn: conn})
      };
    });
  }).flatMap(Bacon.fromArray);
  roomService.parts.onValue(function(part) {
    part.room.users = _.without(part.room.users, part.user);
  });
  roomService.parts.onValue(function(part) {
    broadcastToOthers(roomService, part.user, "part", part.user);
  });

  // TODO - move these out.
  roomService.namesReqs = filterCommand(roomService.requests, "names").map(function(req) {
    var data = req.data,
        room = roomService.rooms[req.data.roomKey],
        user = room && _.find(room.users, {conn: req.from});
    if (!room) {
      return {req: req, accepted: false, reason: "No such room"};
    } else if (!user) {
      return {req: req, accepted: false, reason: "User not in room"};
    } else {
      return {req: req, accepted: true, names: serialize(room.users)};
    }
  });
  roomService.namesReqs.onValue(respondToCommand);

  roomService.messageMsgs = filterCommand(roomService.messages, "message").map(function(msg) {
    return {content: msg.data.content, user: msg.from.user};
  });
  roomService.messageMsgs.onValue(function(msg) {
    broadcastToRoom(roomService, msg.user.room, "message", msg);
  });

  roomService.muteStatus = filterCommand(roomService.messages, "mute").map(function(msg) {
    msg.from.user.audioAvailable = msg.data.audioAvailable;
    msg.from.user.videoAvailable = msg.data.videoAvailable;
    return msg.from.user;
  });
  roomService.muteStatus.onValue(function(user) {
    broadcastToRoom(roomService, user.room, "userUpdate", user);
  });
}

function broadcastToRoom(roomService, room, type, data) {
  _.forEach(room.users, function(user) {
    send(user.conn, {type: type, data: serialize(data)}, roomService.namespace);
  });
}

function broadcastToOthers(roomService, from, type, data) {
  _.forEach(from.room.users, function(user) {
    if (user !== from) {
      send(user.conn, {type: type, data: serialize(data)}, roomService.namespace);
    }
  });
}

function respondToCommand(result) {
  if (result.accepted) {
    reply(result.req, serialize({
      userName: result.user.name,
      room: result.room
    }));
  } else {
    reject(result.req, {msg: result.reason});
  }
}

function isUserBanned(user, room) {
  return _.contains(room.bans, user.fingerprint);
}

function filterCommand(stream, cmd) {
  return stream.filter(function(msg) { return msg.data.cmd === cmd; });
}

module.exports = function(namespace) {
  var roomService = clone(RoomService);
  return function(socketServer) {
    return installService(roomService, namespace, socketServer);
  };
};
