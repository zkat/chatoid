module Polymer from "polymer";
module Bacon from "bacon";
import {findIndex, find, forEach, remove, extend} from "lodash";

Polymer("room-info", {
  /*
   * Properties
   */
  publish: {
    conn: null,
    name: undefined,
    user: null,
    users: [],
    messages: [],
    maxMessages: 1000,
    debug: false,
    video: true,
    audio: true
  },

  /*
   * Lifecycle
   */
  ready: function() {
    this.users = [];
    this.messages = [];
    this._bus = new Bacon.Bus();
    this.joins = this._bus.filter((msg) => msg.type === "join").map(".data");
    this.parts = this._bus.filter((msg) => msg.type === "part").map(".data");
    this.messageStream = this._bus.filter((msg) => msg.type === "message").map(".data");
    this.userUpdates = this._bus.filter((msg) => msg.type === "userUpdate").map(".data");
    var ri = this;
    this._channelChanges = this._bus.filter((msg) => msg.type === "__channelChanged").map(".data");
    this._channelChanges.onValue(function(chan) {
      if (chan && chan.stream) {
        ri._bus.plug(chan.stream.takeUntil(ri._channelChanges));
      }
    });
    this.channelChanged();
    this.joins.onValue(this.userJoined.bind(this));
    this.parts.onValue(this.userParted.bind(this));
    this.messageStream
      .slidingWindow(this.maxMessages)
      .onValue((msgs) => this.messages = msgs);
    this.userUpdates.onValue((user) => {
      var _user = find(this.users||[], {peerId: user.peerId});
      if (_user) { extend(_user, user); }
    });
    this.joinRoom();
  },

  /*
   * Events
   */
  observe: {
    "$.channel": "channelChanged",
    name: "joinRoom",
    conn: "joinRoom",
    peerId: "joinRoom",
    "user.audio": "notifyMute",
    "user.video": "notifyMute"
  },

  channelChanged: function() {
    this._bus.push({type: "__channelChanged", data: this.$.channel});
  },
  
  joinRoom: function() {
    if (!this.conn || !this.peerId || !this.$ || !this.$.channel) { return; }
    var roomInfo = this;
    roomInfo._debug("Joining room: ", this.name);
    roomInfo.$.channel.request({
      cmd: "join",
      key: this.name,
      peerId: this.peerId
    }).then(function(info) {
      roomInfo._debug("Channel joined. Info: ", info);
      roomInfo.users = info.room.users;
      roomInfo.updateOwnUser();
    }, function(e) {
      roomInfo._debug("Channel join error: ", e);
      roomInfo.fire("error", e);
    }).done();
  },

  notifyMute: function() {
    if (!this.$.channel) { return; }
    this.$.channel.send({
      cmd: "mute",
      audioAvailable: this.user.audio,
      videoAvailable: this.user.video
    });
  },

  sendMessage: function(content) {
    if (!this.$.channel) { return; }
    this.$.channel.send({cmd: "message", content: content});
  },

  updateOwnUser: function() {
    var user = find(this.users||[], {peerId: this.peerId});
    this.user = user;
    if (user) {
      user.isLocal = true;
      user.stream = this.mediaStream;
    }
  },

  mediaStreamChanged: function() {
    this.updateOwnUser();
    this._debug("Closing all calls");
    forEach(this.calls, (call) => call.close());
    this._debug("Calling all users: ", this.users);
    forEach(this.users, function(user) {
      if (user.peerId !== this.peerId) {
        this.callUser(user, this.mediaStream);
      }
    }, this);
  },

  callUser: function(user) {
    if (!this.mediaStream) { return; }
    this._debug("Calling ", user);
    this.$.peerManager.call(user.peerId, this.mediaStream);
  },

  userJoined: function(user) {
    this._debug("User joined:", user);
    this.callUser(user);
    this.users.push(user);
    this.updateOwnUser();
  },

  callsChanged: function() {
    this._debug("Calls changed");
    (this.calls || []).forEach(function(call) {
      var user = find(this.users, {peerId: call.peer});
      if (user) {
        call.on("stream", (stream) => user.stream = stream);
      }
    }, this);
  },

  userParted: function(user) {
    this._debug("User parted: ", user);
    var userIdx = findIndex(this.users, {peerId: user.peerId});
    if (~userIdx) {
      this.users.splice(userIdx, 1);
    }
  },

  /*
   * Util
   */
  _debug: function() {
    if (this.debug) {
      console.log.apply(console, ["[<room-info>]"].concat([].slice.call(arguments)));
    }
  },
  errLog: function(e) {
    if (this.debug) {
      console.warn(e);
    }
  }
});
