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
    calls: []
  },
  setupPeer: function() {
    var el = this;
    el.calls.forEach((call) => call.close());
    if (!el.peer) {
      var opts = {key: el.key, port: el.port, host: el.host, path: el.path};
      for (var key in opts) {
        if (opts.hasOwnProperty(key)) {
          if (!opts[key]) {
            delete opts[key];
          }
        }
      }
      el.peer = new Peer(opts);
    }
    el.peer.on("error", (e) => this.fire("error", e));
    el.peer.on("open", (id) => el.peerId = id);
    el.peer.on("call", function(call) {
      call.answer(el.stream);
      call.on("error", (e) => this.file("error", e));
      el.calls.push(call);
    });
  },
  remove: function(call) {
    call.close();
    this.calls.splice(this.calls.indexOf(call), 1);
  },
  call: function(peerId) {
    var call = this.peer.call(peerId, this.stream);
    this.calls.push(call);
    return call;
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
