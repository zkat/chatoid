module Polymer from "polymer";
module Bacon from "bacon";
import {findIndex, find, forEach, remove} from "lodash";

Polymer("room-messages", {
  /*
   * Properties
   */
  publish: {
    conn: null,
    name: undefined,
    user: null,
    users: [],
    messages: [],
    debug: false
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
    var ri = this;
    this._channelChanges = this._bus.filter((msg) => msg.type === "__channelChanged").map(".data");
    this._channelChanges.onValue(function(chan) {
      if (chan && chan.stream) {
        ri._bus.plug(chan.stream.takeUntil(ri._channelChanges));
      }
    });
    this.channelChanged();
    //this.joins.onValue(this.userJoined.bind(this));
    //this.parts.onValue(this.userParted.bind(this));
    this.messageStream.onValue(this.messageReceived.bind(this));
    this.joinRoom();
  },

  /*
   * Events
   */
  observe: {
    "$.channel": "channelChanged",
    name: "joinRoom",
    conn: "joinRoom",
    peerId: "joinRoom"
  },

  messageReceived: function(msg) {
    this.messages.push(msg);
    //scroll to bottom
    debugger;
    var messageWindow = document.getElementById("messages");
    messageWindow.scrollTop = messageWindow.scrollHeight;
  },

  channelChanged: function() {
    this._bus.push({type: "__channelChanged", data: this.$.channel});
  },

  joinRoom: function() {
    if (!this.conn || !this.peerId || !this.$ || !this.$.channel) { return; }
    var roomMessages = this;
    roomMessages._debug("Joining room: ", this.name);
    roomMessages.$.channel.request({
      cmd: "join",
      key: this.name,
      peerId: this.peerId
    }).then(function(info) {
      roomMessages._debug("Channel joined. Info: ", info);
      roomMessages.users = info.room.users;
      roomMessages.updateOwnUser();
    }, function(e) {
      roomMessages._debug("Channel join error: ", e);
      roomMessages.fire("error", e);
    }).done();
  },

  sendMessage: function(content) {
    if (!this.$.channel) { return; }
    this.$.channel.send({cmd: "message", content: content});
  },

  updateOwnUser: function() {
    var user = find(this.users, {peerId: this.peerId});
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
    var userIdx = findIndex(this.users, {name: user.name});
    if (~userIdx) {
      this.users.splice(userIdx, 1);
    }
  },

  /*
   * Util
   */
  _debug: function() {
    if (this.debug) {
      console.log.apply(console, ["[<room-messages>]"].concat([].slice.call(arguments)));
    }
  },
  errLog: function(e) {
    if (this.debug) {
      console.warn(e);
    }
  }
});
