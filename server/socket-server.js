"use strict";

var Genfun = require("genfun"),
    proto = require("proto"),
    clone = proto.clone,
    init = proto.init;

var _ = require("lodash");

var config = require("config");

var Bacon = require("baconjs");

var Sockjs = require("sockjs");

/**
 * Handles websocket-ish connections from storychat clients and takes care
 * of multiplexing messages to their respective handlers.
 */
var SocketServer = clone();

init.addMethod([SocketServer], function(srv, http, opts) {
  initSocket(srv, http, opts);
});

SocketServer.use = function(middleware) {
  return middleware(this);
};

function initSocket(srv, http, opts) {
  console.log("Initializing socketServer");
  srv.socket = Sockjs.createServer();
  srv.socket.installHandlers(http, opts);
  var __connSink;
  srv.connects = Bacon.fromBinder(function(sink) {
    __connSink = sink;
  });
  var __discSink;
  srv.disconnects = Bacon.fromBinder(function(sink) {
    __discSink = sink;
  });
  srv.messages = new Bacon.Bus();
  srv.requests = new Bacon.Bus();
  Bacon.fromEventTarget(srv.socket, "connection").onValue(function(conn) {
    conn.once("data", function(auth) {
      auth = JSON.parse(auth);
      if (validAuth(srv, conn, auth)) {
        initConn(srv, conn);
        __connSink(conn);
      } else {
        console.log("Auth failure for "+conn.remoteAddress);
        conn.write(JSON.stringify({type: "fatal", msg: "Invalid auth"}));
        conn.end();
      }
    });
    conn.on("close", function() { __discSink(conn); });
  });
  srv.connects.onValue(function(conn) {
    console.log("Client at "+conn.remoteAddress+" connected.");
  });
  srv.disconnects.onValue(function(conn) {
    console.log("Client at "+conn.remoteAddress+" disconnected.");
  });
}

function validAuth(srv, conn, auth) {
  conn.fingerprint = auth.fingerprint;
  return auth.key === "letmein" &&
    auth.fingerprint &&
    !_.contains(config.app.bans, auth.fingerprint);
}

function initConn(srv, conn) {
  conn.server = srv;
  conn.closed = Bacon.fromEventTarget(conn, "close").toProperty(false);
  conn.open = conn.closed.not();
  conn.data = Bacon.fromEventTarget(conn, "data").map(JSON.parse).takeWhile(conn.open);
  conn.messages = conn.data.filter(function(msg) {
    return msg.type === "msg";
  }).map(function(msg) {
    return {
      data: msg.data,
      from: conn,
      namespace: msg.ns
    };
  });
  srv.messages.plug(conn.messages);
  conn.requests = conn.data.filter(function(msg) {
    return msg.type === "req";
  }).map(function(msg) {
    return {
      data: msg.data,
      from: conn,
      namespace: msg.ns,
      id: msg.req
    };
  });
  srv.requests.plug(conn.requests);
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

module.exports = {
  SocketServer: SocketServer,
  rawSend: rawSend,
  send: send,
  reply: reply,
  reject: reject
};
