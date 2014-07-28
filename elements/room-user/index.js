module Polymer from "polymer";

Polymer("room-user", {
  publish: {
    user: null
  },
  observe: {
    "user.audio": "userAudioChanged",
    "user.video": "userVideoChanged",
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
  userVideoChanged: function() {
    this.ensureMediaFlags();
    if (this.user.stream) {
      [].forEach.call(this.user.stream.getVideoTracks(),
                      (t) => t.enabled = this.user.video);
    }
  },
  userAudioChanged: function() {
    this.ensureMediaFlags();
    if (this.user.stream) {
      [].forEach.call(this.user.stream.getAudioTracks(),
                      (t) => t.enabled = this.user.audio);
    }
  }
});
