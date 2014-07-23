module Polymer from "polymer";
module Bacon from "bacon";

Polymer("socket-channel", {
  publish: {
    namespace: "",
    conn: null,
    stream: null
  },
  send: function(data) {
    return this.conn.send(data, this.namespace);
  },
  request: function(data) {
    return this.conn.request(data, this.namespace);
  },
  plugConnStream: function() {
    if (!this.conn) { return; }
    var conn = this.conn;
    this.stream.plug(this.conn.stream
                     .filter((msg => msg.ns === this.namespace))
                     .map(".data")
                     .takeWhile(() => conn === this.conn));
  },
  connChanged: function() {
    this.plugConnStream();
  },
  ready: function() {
    var channel = this;
    channel.stream = new Bacon.Bus();
    this.plugConnStream();
  }
});
