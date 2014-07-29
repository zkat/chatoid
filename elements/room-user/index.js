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
    this.userVideoChanged();
    this.userAudioChanged();
  },
  userVideoChanged: function() {
    this.ensureMediaFlags();
    var user = this.user;
    if (user && user.stream) {
      [].forEach.call(user.stream.getVideoTracks(),
                      (t) => t.enabled = this.user.video);
    }
  },
  userAudioChanged: function() {
    this.ensureMediaFlags();
    var user = this.user;
    if (user && user.stream) {
      [].forEach.call(user.stream.getAudioTracks(),
                      (t) => t.enabled = this.user.audio);
    }
  }
});
