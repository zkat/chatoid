var webpack = require("webpack"),
	_ = require("lodash"),
	glob = require("glob");
module.exports = {
  entry: _.reduce(glob.sync("elements/*/index.js"), function(acc, file) {
	var match = file.match(/([^\/]+)\/index.js/);
	if (match) {
	  acc[match[1]] = file;
	}
	return acc;
  }, {}),
  output: {
	path: __dirname + "/dist/",
	filename: "elements/[name]/index.js",
    sourceMapFilename: "index.js.map"
  },
  resolve: {
	alias: {
	  "lodash": "lodash/dist/lodash.js",
	  "jquery": "jquery/dist/jquery.js",
	  "bacon": "bacon/dist/Bacon.js",
	  "bacon-browser": "bacon-browser/dist/bacon-browser.js"
	},
	modulesDirectories: [__dirname, "bower_components", "node_modules"]
  },
  externals: {
	polymer: "var Polymer"
  },
  module: {
	loaders: [{
	  test: /elements\/.*\.js$/,
	  loader: "transform/cacheable?es6ify"
	}]
  },
  plugins: [
	new webpack.optimize.CommonsChunkPlugin("index.js"),
	new webpack.ProvidePlugin({
	  Bacon: "Bacon",
	  jQuery: "jquery",
	  $: "jquery"
	})
  ]
};
