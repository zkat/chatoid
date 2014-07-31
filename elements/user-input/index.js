module Polymer from "polymer";

Polymer("user-input", {
  publish: {
    roomInfo: null
  },
  sendMessage: function() {
    if (!this.roomInfo) { return; }
    this.roomInfo.sendMessage(this.$.input.value);
    this.$.input.inputValue = "";
    this.$.input.commit();
  },
  maybeSubmit: function(ev) {
    if (ev.keyCode === 13 && !ev.shiftKey &&
        this.$.input && this.$.input.inputValue) {
      ev.preventDefault();
      this.$.input.commit();
      this.sendMessage();
    }
  }
});
