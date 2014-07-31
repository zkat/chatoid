module Polymer from "polymer";
module Peer from "peerjs";

Polymer("peer-call-manager", {
  publish: {
    peer: null,
    stream: null,
    peerId: "",
    // key: "lwjd5qra8257b9",
    // host: "",
    // port: 9000,
    // path: "",
    key: "peerjs",
    host: window.location.hostname,
    port: window.location.port || 80,
    path: "/_peerjs/",
    calls: [],
    debug: false
  },
  setupPeer: function() {
    var el = this;
    this._debug("Closing existing calls.");
    el.calls.forEach((call) => call.close());
    if (!el.peer) {
      this._debug("Creating new Peer");
      var opts = {
        key: el.key,
        port: el.port,
        host: el.host,
        path: el.path,
        debug: el.debug ? 2 : 0,
        config: {
          iceServers: [
            { url: 'stun:stun.l.google.com:19302' }
          ]
        }
      };
      for (var key in opts) {
        if (opts.hasOwnProperty(key)) {
          if (!opts[key]) {
            delete opts[key];
          }
        }
      }
      el.peer = new Peer(opts);
      this._debug("Peer created: ", el.peer);
    }
    el.peer.on("error", (e) => {
      if (e.type === "disconnect" || e.type === "network") {
        if (el.peer.disconnected) {
          this._debug("Disconnected from server. Attempting reconnect");
          el.peer.reconnect();
        }
      }
      this.fire("error", e);
    });
    el.peer.on("open", (id) => el.peerId = id);
    el.peer.on("call", function(call) {
      el._debug("Received call: ", call);
      call.answer(el.stream);
      el._debug("Call answered");
      el.handleCall(call);
    });
  },

  handleCall: function(call) {
    call.on("close", () => this._debug("Call closed"));
    call.on("error", (e) => this.fire("error", e));
    call.on("stream", (s) => this._debug("Stream set up: ", s));
    this.calls.push(call);
  },

  _debug: function() {
    if (this.debug) {
      console.log.apply(console, ["[<peer-call-manager>]"].concat([].slice.call(arguments)));
    }
  },
  remove: function(call) {
    this._debug("Removing call: ", call);
    call.close();
    this.calls.splice(this.calls.indexOf(call), 1);
  },
  call: function(peerId, stream) {
    var call = this.peer.call(peerId, stream || this.stream);
    if (call) {
      this.handleCall(call);
    }
    return call;
  },
  streamChanges: function() {
    this.setupPeer();
  },
  observe: {
    "key": "setupPeer",
    "host": "setupPeer",
    "port": "setupPeer",
    "path": "setupPeer"
  },
  created: function() {
    this.calls = [];
  },
  ready: function() {
    this.setupPeer();
  }
});
