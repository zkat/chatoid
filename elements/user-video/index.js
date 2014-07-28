module Polymer from "polymer";

Polymer("user-video", {
  publish: {
    user: null
  },
  streamUrl: function(stream) {
    return stream ? URL.createObjectURL(stream) : "";
  }
});
