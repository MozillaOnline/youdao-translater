/* vim: set ts=2 et sw=2 tw=80: */
"use strict";

const {Cc, Cu} = require('chrome');
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyGetter(this, "CETracking", function() {
  return Cc["@mozilla.com.cn/tracking;1"].getService().wrappedJSObject;
});

exports.tracker = {
  _url: 'http://addons.g-fox.cn/youdao-translator.gif?',
  track: function(params) {
    let url = this._url + 'r=' + Math.random();
    for (let i in params) {
      url += '&' + i + '=' + params[i];
    }
    try {
      CETracking.send(url);
    } catch(e) {}
  }
};
