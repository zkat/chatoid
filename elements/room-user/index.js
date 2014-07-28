module Polymer from "polymer";

Polymer("room-user", {
  publish: {
    user: null
  },
  observe: {
    "user.audio": "userAudioChanged",
    "user.video": "userVideoChanged",
    "user.stream": "userStreamChanged",
    user: "ensureMediaFlags"
  },
  created: function() {
    this.ensureMediaFlags();
  },
  ensureMediaFlags: function() {
    if (!this.user) { return; }
    if (!this.user.hasOwnProperty("audio")) {
      this.user.audio = true;
    }
    if (!this.user.hasOwnProperty("video")) {
      this.user.video = true;
    }
  },
  userStreamChanged: function() {
    // TODO - handles tracks being added/removed
    var stream = this.user.originalStream || this.user.stream;
    if (stream) {
      var user = this.user;
      [].forEach.call(stream.getVideoTracks(), function(track) {
        var checker = () => user.videoAvailable = track.readyState === "live";
        checker();
        Object.observe(track, (changes) => console.log(changes));
      });
      [].forEach.call(stream.getAudioTracks(), function(track) {
        var checker = () => user.audioAvailable = track.readyState === "live";
        checker();
        track.addEventListener("started", checker);
        track.addEventListener("muted", checker);
        track.addEventListener("unmuted", checker);
      });
    }
  },
  userVideoChanged: function() {
    this.ensureMediaFlags();
    var stream = this.user.originalStream || this.user.stream;
    if (stream) {
      [].forEach.call(stream.getVideoTracks(),
                      (t) => t.enabled = this.user.video);
    }
  },
  userAudioChanged: function() {
    this.ensureMediaFlags();
    var stream = this.user.originalStream || this.user.stream;
    if (stream) {
      [].forEach.call(stream.getAudioTracks(),
                      (t) => t.enabled = this.user.audio);
    }
  }
});
