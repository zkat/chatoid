//module Polymer from "polymer";

Polymer("video-service", {
  viewModel: {
    name: "Kat"
  },
  created: function() {
    // Dummy data for now.
    // TODO: hook this up to the true data source.
    this.videos = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
  },
  ready: function() {
    console.log("Video service hello!");
  }
});
