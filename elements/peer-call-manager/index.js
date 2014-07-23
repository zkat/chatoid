module Polymer from "polymer";
module Peer from "peerjs";

Polymer("peer-call-manager", {
  publish: {
    peer: null,
    stream: null,
    peerId: "",
    key: "lwjd5qra8257b9",
    host: "",
    port: 9000,
    path: "",
    calls: [],
    debug: false
  },
  setupPeer: function() {
    var el = this;
    this._debug("Closing existing calls.");
    el.calls.forEach((call) => call.close());
    if (!el.peer) {
      this._debug("Creating new Peer");
      var opts = {key: el.key, port: el.port, host: el.host, path: el.path};
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
    el.peer.on("error", (e) => this.fire("error", e));
    el.peer.on("open", (id) => el.peerId = id);
    el.peer.on("call", function(call) {
      this._debug("Received call: ", call);
      call.answer(el.stream);
      this._debug("Call answered");
      call.on("close", () => this.debug("Call closed"));
      call.on("error", (e) => this.fire("error", e));
      el.calls.push(call);
    });
  },
  _debug: function() {
    if (this.debug) {
      console.log.apply(console, arguments);
    }
  },
  remove: function(call) {
    this._debug("Removing call: ", call);
    call.close();
    this.calls.splice(this.calls.indexOf(call), 1);
  },
  call: function(peerId) {
    var call = this.peer.call(peerId, this.stream);
    this.calls.push(call);
    return call;
  },
  streamChanges: function() {
    this.setupPeer();
  },
  keyChanged: function() {
    this.setupPeer();
  },
  created: function() {
    this.calls = [];
  },
  ready: function() {
    this.setupPeer();
  }
});
