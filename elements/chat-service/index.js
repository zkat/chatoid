//module Polymer from "polymer";

Polymer("chat-service", {
  viewModel: {
    name: "Kat"
  },
  created: function() {
    // Dummy data for now.
    // TODO: hook this up to the true data source.
    this.messages = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
  },
  ready: function() {
    console.log("Chat service hello!");
  }
});
