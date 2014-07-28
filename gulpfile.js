var gulp = require("gulp"),
    gutil = require("gulp-util"),
    rename = require("gulp-rename"),
    rimraf = require("rimraf"),
    server = require("./server"),
    vulcanize = require("vulcanize"),
    _ = require("lodash"),
    webpack = require("webpack"),
    webpackConfig = require("./webpack.config.js");

var paths = {
  bower_components: "bower_components/*/*",
  index: "index.html",
  elements: "elements/*",
  styles: "styles/*",
  dist: "dist/"
};

gulp.task("clean", function(cb) {
  rimraf("dist/", cb);
});

gulp.task("connect", function() {
  server(8080);
});

gulp.task("webpack-watch", function() {
  webpack(_.merge({
    devtool: "#sourcemap"
  }, webpackConfig)).watch(200, function(err, stats) {
    if(err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
      color: true
    }));
  });
});

gulp.task("webpack", function(callback) {
  webpack(_.merge({
    // opts
  }, webpackConfig)).run(function(err, stats) {
    if(err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
      color: true
    }));
    callback();
  });
});

gulp.task("vulcanize", function(callback) {
  var out = "__vulcanized.html";
  vulcanize.setOptions({
    input: paths.index,
    output: out
  }, function() {
    vulcanize.processDocument();
    gulp.src(out)
      .pipe(rename("index.html"))
      .pipe(gulp.dest(paths.dist))
      .on("end", function() {
        rimraf(out, callback);
      });
  });
});

gulp.task("move-bower", function() {
  return gulp.src(paths.bower_components)
    .pipe(gulp.dest("dist/bower_components/"));
});

gulp.task("move-bower-watch", ["move-bower"], function() {
  gulp.watch(paths.bower_components, ["move-bower"]);
});

gulp.task("move-styles", function() {
  return gulp.src(paths.styles)
    .pipe(gulp.dest("dist/styles/"));
});

gulp.task("move-styles-watch", ["move-styles"], function() {
  gulp.watch(paths.styles, ["move-styles"]);
});
gulp.task("vulcanize-watch", ["vulcanize"], function() {
  gulp.watch([paths.index, paths.elements+"*/*.{html,css}"], ["vulcanize"]);
});

gulp.task("build", ["webpack", "vulcanize", "move-bower", "move-styles"]);
gulp.task("watch", ["webpack-watch", "vulcanize-watch", "move-bower-watch", "move-styles-watch"]);
gulp.task("dev", ["watch", "connect"]);
gulp.task("default", ["build"]);
