module Polymer from "polymer";

Polymer("peer-call", {
  publish: {
    sourcePeer: null,
    sourceStream: null,
    peerId: "",
    peerStream: null,
    peerStreamUrl: "",
    /* Danger. Don't use this unless you know what you're doing. */
    mediaConnection: null
  },
  streamReady: function(stream) {
    this.peerStreamUrl = window.URL.createObjectURL(stream);
    this.peerStream = stream;
    this.fire("stream", stream);
  },
  mediaConnectionChanged: function() {
    this.mediaConnection.on("stream", this.streamReady.bind(this));
    this.mediaConnection.on("error", (function(e) {
      this.fire("error", e);
    }).bind(this));
    this.mediaConnection.on("close", (function() {
      this.fire("close");
    }).bind(this));
  },
  call: function(force) {
    if (this.sourcePeer && this.sourceStream && this.peerId) {
      this.mediaConnection = this.sourcePeer.call(this.peerId, this.sourceStream);
    } else if (!this.mediaConnection){
      this.fire("error",
                new Error("source-peer, source-stream, and peer-id are required."));
    }
  },
  close: function() {
    if (this.mediaConnection) {
      this.mediaConnection.close();
      delete this.mediaConnection;
    }
  },
  ready: function() {
    this.call();
  },
  detached: function() {
    this.close();
  }
});

