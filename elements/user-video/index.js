module Polymer from "polymer";

Polymer("user-video", {
  publish: {
    user: null
  },
  streamUrl: function(stream) {
    return stream ? URL.createObjectURL(stream) : "";
  },
  toggleVideo: function() {
    this.user.video = !this.user.video;
  },
  videoIcon: function(enabled) {
    return enabled ? 'av:videocam' : 'av:videocam-off';
  }
});
