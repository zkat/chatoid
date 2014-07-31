"use strict";

var proto = require("proto"),
    clone = proto.clone,
    init = proto.init;

var lodash = require("lodash"),
    each = lodash.each,
    partial = lodash.partial,
    extend = lodash.extend;

var sessionStore = require("session");

var PeerServer = require("peer").PeerServer;

var config = require("config");

/**
 * Handles web server connections and routing of http requests.
 */
var WebServer = clone(),
    routes = [];

init.addMethod([WebServer], function(srv, opts) {
  srv.opts = opts;
});

function configureApp(srv, opts) {
  srv.sessionStore = sessionStore();
  var app = srv.app;
  app.use(require("morgan")(config.env === "production" ? "short" : "dev"));
  app.use(require("cookie-parser")());
  app.use(require("express-session")({
    store: srv.sessionStore,
    key: "chatoid-session",
    secret: opts.sessionSecret,
    cookie: { maxAge: 1000*60*60*24*45 }
  }));
  app.use(require("serve-static")(opts.staticDir));
  app.use(require("compression")());
  each(routes, function(route) {
    app[route.method](route.path, partial(route.callback, srv));
  });
}

function listen(srv, port) {
  srv.app = PeerServer(extend({
    path: "/_peerjs/",
    key: "peerjs",
    port: port
  }, srv.opts));
  configureApp(srv, srv.opts);
  srv.http = srv.app._server;
}

/*
 * Routes
 */
defRoute("get", "/wsauth", function(srv, req, res) {
  var authInfo = {
    wsUrl: "http://" + req.headers.host + "/ws",
    auth: {
      key: "letmein"
    }
  };
  res.send({data: authInfo});
});

// This one must always be last!
/*
defRoute("get", "*", function(srv, req, res) {
  // Any other URLs, reroute to /#/url, to allow can.route/pushState to
  // make things awesome.
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.redirect("#!"+req.url.substr(1));
});
 */

/*
 * Util
 */
function defRoute(method, urlPath, callback) {
  routes.push({
    method: method,
    path: urlPath,
    callback: callback
  });
}

module.exports = {
  WebServer: WebServer,
  listen: listen
};
