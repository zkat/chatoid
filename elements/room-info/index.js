module Polymer from "polymer";
module Bacon from "bacon";
import {findIndex, find, forEach} from "lodash";

Polymer("room-info", {
  publish: {
    conn: null,
    name: undefined,
    users: []
  },
  errLog: function(e) {
    if (this.debug) {
      console.warn(e);
    }
  },
  joinRoom: function() {
    if (!this.conn || !this.peerId) { return; }
    var roomInfo = this;
    this.$.channel.request({
      method: "join",
      resource: "room",
      key: this.name,
      peerId: this.peerId
    }).then(function(info) {
      roomInfo.users = info.room.users;
      roomInfo.updateOwnUserStream();
      roomInfo._bus.plug(roomInfo.$.channel.stream
        .takeWhile(() => roomInfo.name === (info.room && info.room.key)));
    });
  },
  updateOwnUserStream: function() {
    var user = find(this.users, {peerId: this.peerId});
    if (user) {
      var ownStream = this.mediaStream.clone();
      forEach(ownStream.getAudioTracks(), (track) => ownStream.removeTrack(track));
      user.stream = ownStream;
    }
  },
  mediaStreamChanged: function() {
    this.updateOwnUserStream();
    forEach(this.calls, (call) => call.close());
    forEach(this.users, function(user) {
      this.callUser(user);
    }, this);
  },
  nameChanged: function() {
    this.joinRoom();
  },
  connChanged: function() {
    this.joinRoom();
  },
  peerIdChanged: function() {
    this.joinRoom();
  },
  detached: function() {
    this._bus.end();
  },
  created: function() {
    this.users = [];
    this._bus = new Bacon.Bus();
    this.joins = this._bus.filter((msg) => msg.type === "join").map(".data");
    this.parts = this._bus.filter((msg) => msg.type === "part").map(".data");
    
    this.joins.onValue(this.userJoined.bind(this));
    this.parts.onValue(this.userParted.bind(this));
  },
  callUser: function(user) {
    this.$.peerManager.call(user.peerId);
  },
  userJoined: function(user) {
    this.users.push(user);
    if (user.peerId !== this.peerId) {
      this.callUser(user);
    }
  },
  callsChanged: function() {
    this.calls.forEach(function(call) {
      var user = find(this.users, {peerId: call.peer});
      if (user) {
        call.on("stream", (stream) => user.stream = stream);
      }
    }, this);
  },
  userParted: function(user) {
    this.users.splice(
      findIndex(this.users, {name: user.name}),
      1);
  },
  ready: function() {
    this.joinRoom();
  }
});
