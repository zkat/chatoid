"use strict";

var proto = require("proto"),
    clone = proto.clone,
    init = proto.init;

var lodash = require("lodash"),
    each = lodash.each,
    partial = lodash.partial;

var express = require("express"),
    http = require("http"),
    sessionStore = require("session");

var config = require("config");

/**
 * Handles web server connections and routing of http requests.
 */
var WebServer = clone(),
    routes = [];

init.addMethod([WebServer], function(srv, opts) {
  srv.app = express();
  srv.http = http.createServer(srv.app);
  configureApp(srv, opts);
});

function configureApp(srv, opts) {
  srv.sessionStore = sessionStore();
  var app = srv.app;
  app.use(require("morgan")(config.env === "production" ? "short" : "dev"));
  app.use(require("body-parser")());
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
  srv.http.listen(port, function() {
    console.log("Listening on "+port);
  });
}

/*
 * Routes
 */
defRoute("get", "/wsauth", function(srv, req, res) {
  var authInfo = {
    wsUrl: "http://" + req.headers.host + "/ws",
    auth: "letmein"
  };
  res.send({data: authInfo});
});

// This one must always be last!
defRoute("get", "*", function(srv, req, res) {
  // Any other URLs, reroute to /#/url, to allow can.route/pushState to
  // make things awesome.
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.redirect("#!"+req.url.substr(1));
});

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
