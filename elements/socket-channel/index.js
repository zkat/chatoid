module Polymer from "polymer";
module Bacon from "bacon";

Polymer("socket-channel", {
  publish: {
    namespace: ""
  },
  send: function(data) {
    return this.parentElement.send(data, this.namespace);
  },
  request: function(data) {
    return this.parentElement.request(data, this.namespace);
  },
  ready: function() {
    var channel = this;
    channel.stream = channel.parentElement.stream
      .filter((msg) => msg.ns === channel.namespace)
      .map(".data");
  }
});
