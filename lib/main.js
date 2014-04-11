// This is an active module of the jiaofeng Add-on
const self = require("sdk/self");
const prefs = require("sdk/preferences/service");
var _ = require("sdk/l10n").get;
const TBB_LABEL = _("tbb.label");
const {Cu} = require('chrome');

exports.main = function() {
  require('WidgetHelper').init({
    id: "youdao-translate-icon",
    label: TBB_LABEL,
    icons: {
      "default": "icon"
    },
    oncommand: function () {
      require("sdk/tabs").activeTab.url = "javascript:%20void((function()%20{var%20element%20=%20document.createElement('script');element.id%20=%20'outfox_seed_js';element.charset%20=%20'utf-8',element.setAttribute('src',%20'http://fanyi.youdao.com/web2/seed.js?'%20+%20Date.parse(new%20Date()));document.body.appendChild(element);})())";
    }
  });

  try {
      let jsm = {};
      Cu.import('resource://cmtracking/ExtensionUsage.jsm', jsm);
      jsm.ExtensionUsage.register('youdao-translate-icon', 'window:button',
        'youdao-translate@mozillaonline.com');
   } catch(e) {};
};
