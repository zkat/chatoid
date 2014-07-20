"use strict";

var Genfun = require("genfun");

var init = new Genfun();
init.addMethod([], function(){});

/**
 * Like `new`, but doesn't work off constructor functions and is more
 * prototype-y.
 */
function clone(parent) {
  var initargs = [].slice.call(arguments, 1),
      obj = Object.create(parent || Object.prototype),
      initRet = init.apply(parent, [obj].concat(initargs));
  return typeof initRet === "object" ? initRet : obj;
}

function parent(obj) {
  return Object.getPrototypeOf(obj);
}

module.exports = {
  clone: clone,
  parent: parent,
  init: init
};
