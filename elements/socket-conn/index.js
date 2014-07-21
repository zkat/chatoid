module Polymer from "polymer";
module Bacon from "bacon";
module $ from "jquery";
import {partial, forEach} from "lodash";
module Q from "q";
import "sockjs";

var Sock = window.SockJS;

Polymer("socket-conn", {
  publish: {
    maxReconnectAttempts: 100,
    initialReconnectDelay: 500,
    requestTimeout: 30000,
    authUrl: "/wsauth"
  },
  send: send,
  request: request,
  channels: [],
  reconnect: function() {
    if (this.status !== "open") {
      this.reconnectAttempts = 0;
      tryReconnect(this);
    }
  },
  ready: function() {
    var conn = this;
    conn._bus = new Bacon.Bus();
    conn.stream = conn._bus.toEventStream();
    conn.status = "connecting";
    conn.statusProperty = conn._bus
      .filter((msg) => msg.type === "status")
      .map(".status")
      .toProperty();
    conn._bus.push({type: "status", status: conn.status});
    loadChannels(conn);
    conn.onMutation(this, function() {
      loadChannels(this);
    });
    conn.reqNum = 0;
    conn.reqs = {};
    conn.backlog = [];
    conn.reconnectAttempts = 0;
    conn.opts = {};
    initSock(conn);
  }
});

function loadChannels(conn) {
  forEach(conn.querySelectorAll(":host > socket-channel"), function(el) {
    if (el.namespace) {
      conn.channels[el.namespace] = el;
    }
  }, conn);
}
function initSock(conn) {
  return $.get(conn.authUrl, function(resp) {
    if (conn.status === "closed") { return; }
    conn.url = resp.data.wsUrl;
    conn.auth = resp.data.auth;
    conn.socket = new Sock(conn.url, null, conn.opts);
    conn.socket.onopen = partial(handleOpen, conn);
    conn.socket.onmessage = partial(handleMessage, conn);
    conn.socket.onclose = partial(tryReconnect, conn);
  }).fail(partial(tryReconnect, conn));
}

function handleOpen(conn) {
  conn.reconnectAttempts = 0;
  conn.socket.send(conn.auth);
  conn.status = "open";
  conn._bus.push({type: "status", status: conn.status});
  var oldMsg;
  while ((conn.socket.readyState === Sock.OPEN) &&
         (oldMsg = conn.backlog.shift())) {
    rawSend(conn, oldMsg);
  }
}

function tryReconnect(conn) {
  if (conn.reconnectAttempts < conn.maxReconnectAttempts) {
    conn.reconnectAttempts++;
    conn.status = "reconnecting";
    conn._bus.push({type: "status", status: conn.status});
    window.setTimeout(function() {
      initSock(conn);
    }, conn.reconnectAttempts * conn.initialReconnectDelay);
  } else {
    conn.status = "closed";
    conn._bus.push({type: "status", status: conn.status});
  }
}

function handleMessage(conn, sockMsg) {
  var msg = JSON.parse(sockMsg.data);
  switch (msg.type) {
  case "reply":
  case "reject":
    var req = conn.reqs[msg.req];
    if (!req) {
      console.warn("Unexpected reply: ", msg);
      return;
    }
    if (msg.type === "reply") {
      req.resolve(msg.data);
    } else {
      req.reject(msg.data);
    }
    delete conn.reqs[msg.req];
    break;
  case "msg":
    conn._bus.push(msg);
    break;
  default:
    console.warn("Unexpected message: ", msg);
    break;
  }
}

function rawSend(conn, data) {
  if (conn.status === "closed") {
    throw new Error("connection is closed");
  } else if (conn.socket && conn.socket.readyState === Sock.OPEN) {
    conn.socket.send(data);
  } else {
    conn.backlog.push(data);
  }
}

function send(data, namespace) {
  rawSend(this, JSON.stringify({type: "msg", ns: namespace, data: data}));
}

function request(data, namespace) {
  var deferred = Q.defer(),
      req = ++this.reqNum;
  rawSend(this, JSON.stringify({type: "req", req: req, ns: namespace, data: data}));
  this.reqs[req] = deferred;
  return Q.timeout(deferred.promise, this.requestTimeout);
}
