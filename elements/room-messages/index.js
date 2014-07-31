module Polymer from "polymer";

Polymer("room-messages", {
  publish: {
    messages: null
  },
  messagesChanged: function() {
    // This needs to be async because we need to wait until the new message is
    // rendered to scroll the view ... but we can't do this.onMutation either,
    // because it doesn't work.
    this.job("updateScroll", () => {
      this.$.messages.scrollTop = this.$.messages.scrollHeight;
    }, 0);
  }
});
