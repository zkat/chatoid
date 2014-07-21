//module Polymer from "polymer";

Polymer("chat-output", {
  viewModel: {
    name: "Kat"
  },
  ready: function() {
    console.log("chat-output say Hello!");
  }
});
