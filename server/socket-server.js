"use strict";

var Genfun = require("genfun"),
    proto = require("proto"),
    clone = proto.clone,
    init = proto.init;

var _ = require("lodash"),
    each = _.each,
    partial = _.partial,
    without = _.without;

var Sockjs = require("sockjs");

/**
 * Handles websocket-ish connections from storychat clients and takes care
 * of multiplexing messages to their respective handlers.
 */
var SocketServer = clone();

init.addMethod([SocketServer], function(srv, http, opts) {
  srv.connections = [];
  srv.services = opts.services;
  initSocket(srv, http, opts);
});

var onConnect = new Genfun(),
    onMessage = new Genfun(),
    onRawMessage = new Genfun(),
    onRequest = new Genfun(),
    onClose = new Genfun();
onConnect.addMethod([], function() {});
onMessage.addMethod([], function() {});
onRawMessage.addMethod([], function() {});
onRequest.addMethod([], function() {});
onClose.addMethod([], function() {});

function initSocket(srv, http, opts) {
  console.log("Initializing socketServer");
  srv.socket = Sockjs.createServer();
  srv.socket.on("connection", partial(onClientConnection, srv));
  srv.socket.installHandlers(http, opts);
}

function onClientConnection(srv, conn) {
  console.log("Received connection from "+conn.remoteAddress+".");
  // TODO - wait to push until the client has been verified.
  conn.once("data", function(auth) {
    if (validAuth(srv, conn, auth)) {
      initConn(srv, conn);
      srv.connections.push(conn);
    } else {
      conn.write("Invalid auth");
      conn.end();
    }
  });
}

function validAuth(srv, conn, auth) {
  return auth === "letmein";
}

function initConn(srv, conn) {
  conn.server = srv;
  each(srv.services, function(service) {
    onConnect(service, conn);
  });
  conn.on("data", partial(onClientMessage, srv, conn));
  conn.on("close", partial(onClientClose, srv, conn));
}

function onClientMessage(srv, conn, msg) {
  try {
    var json = JSON.parse(msg),
        service = srv.services[json.ns];
    if (service) {
      messageCallback(service, conn, json);
    } else {
      throw new Error("Invalid service: "+json.namespace);
    }
  } catch (e) {
    console.error("An error occurred while processing socket message:", {
      error: e,
      input: msg
    });
  }
}

function messageCallback(service, conn, msg) {
  switch (msg.type) {
  case "msg":
    onMessage(service, msg.data, {from: conn, namespace: msg.ns});
    break;
  case "req":
    onRequest(service, msg.data, {from: conn, id: msg.req});
    break;
  default:
    onRawMessage(service, msg, conn);
  }
}

function onClientClose(srv, conn) {
  console.log("Client at "+conn.remoteAddress+" disconnected.");
  try {
    each(srv.services, function(service) {
      onClose(service, conn);
    });
  } finally {
    srv.connections = without(srv.connections, conn);
  }
}

function rawSend(conn, data) {
  conn.write(JSON.stringify(data));
}

function send(conn, data, namespace) {
  rawSend(conn, {type: "msg", ns: namespace, data: data});
}

function reply(req, data) {
  rawSend(req.from, {type: "reply", req: req.id, data: data});
}

function reject(req, reason) {
  rawSend(req.from, {type: "reject", req: req.id, data: reason});
}

function broadcast(conn, data, namespace) {
  each(conn.server.connections, function(conn) {
    send(conn, data, namespace);
  });
}

function broadcastFrom(srcConn, data, namespace) {
  each(srcConn.server.connections, function(conn) {
    if (srcConn !== conn) {
      send(conn, data, namespace);
    }
  });
}

module.exports = {
  SocketServer: SocketServer,
  onConnect: onConnect,
  onRawMessage: onRawMessage,
  onMessage: onMessage,
  onRequest: onRequest,
  onClose: onClose,
  rawSend: rawSend,
  send: send,
  reply: reply,
  reject: reject,
  broadcast: broadcast,
  broadcastFrom: broadcastFrom
};
