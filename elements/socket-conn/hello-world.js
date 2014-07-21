module Bacon from "bacon";
module $ from "jquery";
module Polymer from "polymer";
import "bacon-browser";

Polymer("hello-world", {
	ready: function() {
		console.log("Hello world!");
	}
});
