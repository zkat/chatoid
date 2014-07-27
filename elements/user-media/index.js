module Polymer from "polymer";

var getUserMedia  = navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;

Polymer("user-media", {
  publish: {
    audio: true,
    video: true,
    stream: null,
    src: ""
  },
  reload: function() {
    if (!getUserMedia) {
      this.streamError(new Error("User media not supported"));
    } else {
      getUserMedia.call(navigator,
                        {audio: this.audio, video: this.video},
                        this.streamReady.bind(this),
                        this.streamError.bind(this));
    }
  },
  stop: function() {
    if (this.stream) {
      this.stream.stop();
    }
  },
  streamReady: function(stream) {
    this.src = window.URL.createObjectURL(stream);
    this.stream = stream;
    this.fire("stream", stream);
  },
  streamError: function(e) {
    this.fire("error", e);
  },
  audioChanged: function() {
    if (this.stream) {
      [].forEach.call(this.stream.getAudioTracks(), (t) => t.enabled = this.audio);
    }
  },
  videoChanged: function() {
    if (this.stream) {
      [].forEach.call(this.stream.getVideoTracks(), (t) => t.enabled = this.video);
    }
  },
  ready: function() {
    this.reload();
  },
  detached: function() {
    this.stop();
  }
});
