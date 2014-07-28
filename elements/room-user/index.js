module Polymer from "polymer";

Polymer("room-user", {
  publish: {
    user: null
  },
  observe: {
    "user.audio": "userAudioChanged",
    "user.video": "userVideoChanged"
  },
  userVideoChanged: function() {
    if (this.user.stream) {
      [].forEach.call(this.user.stream.getVideoTracks(),
                      (t) => t.enabled = this.user.video);
    }
  },
  userAudioChanged: function() {
    if (this.user.stream) {
      [].forEach.call(this.user.stream.getAudioTracks(),
                      (t) => t.enabled = this.user.audio);
    }
  }
});
