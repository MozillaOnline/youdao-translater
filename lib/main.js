/* vim: set ts=2 et sw=2 tw=80: */
// This is an active module of the jiaofeng Add-on
const self = require('sdk/self');
const prefs = require('sdk/preferences/service');
var _ = require('sdk/l10n').get;
var windows = require('sdk/windows');
var tabs = require('sdk/tabs');
var {viewFor} = require('sdk/view/core');
var {tracker} = require('tracker');
const TBB_LABEL = _('tbb.label');
const {Cc, Ci, Cu} = require('chrome');
Cu.import('resource://gre/modules/XPCOMUtils.jsm');
XPCOMUtils.defineLazyModuleGetter(this,
  'Services', 'resource://gre/modules/Services.jsm');
XPCOMUtils.defineLazyModuleGetter(this,
  'CustomizableUI', 'resource:///modules/CustomizableUI.jsm');

var buttonId = 'youdao-translate-icon';

function refreshButton(tab) {
  let node = CustomizableUI.getWidget(buttonId).forWindow(viewFor(tab.window)).node;
  let whitelist = ['about:customizing'];
  tab.url.indexOf('http://') == 0 || whitelist.indexOf(tab.url) >= 0 ?
    node.removeAttribute('disabled') :
    node.setAttribute('disabled', true);
}

function allowTranslationInfoBar(aURI) {
  if (prefs.get('browser.translation.ui.show', false)) {
    return false;
  }

  let perms = Services.perms;
  return perms.testPermission(aURI, 'mozcn-translate') != perms.DENY_ACTION;
}

function showTranslationInfoBar(aBrowser) {
  let gBrowser = aBrowser.ownerGlobal.gBrowser;
  let notificationBox = gBrowser.getNotificationBox(aBrowser);
  let notif = notificationBox.appendNotification('',
    'mozcn-translation', null,
    notificationBox.PRIORITY_INFO_HIGH);
  notif.init(aBrowser, tracker, {
    openPreferencePage: function() {
      require('PrefsUtils').open({id: self.id});
    }
  });
}

function showYoudaoTranslator() {
  require("sdk/tabs").activeTab.url = "javascript:%20void((function()%20{var%20element%20=%20document.createElement('script');element.id%20=%20'outfox_seed_js';element.charset%20=%20'utf-8',element.setAttribute('src',%20'http://fanyi.youdao.com/web2/seed.js?'%20+%20Date.parse(new%20Date()));document.body.appendChild(element);})())";
}

function messageListener(msg) {
  if (msg.data.detectedLanguage != 'en') {
    return;
  }

  let browser = msg.target;
  let uri = browser.currentURI;
  if (!uri.schemeIs('http')) {
    return;
  }

  tracker.track({event: 'EnglishPageDetected'});
  if (!allowTranslationInfoBar(uri)) {
    return;
  }

  let display = prefs.get('extensions.mozcn-translation.display', 'ask');
  switch (display) {
    case 'ask': {
      tracker.track({event: 'infoBarShown'});
      showTranslationInfoBar(browser);
      break;
    }
    case 'auto': {
      showYoudaoTranslator();
      break;
    }
    case 'never':
    default: {
      break;
    }
  }
}

exports.main = function() {
  require('WidgetHelper').init({
    id: buttonId,
    label: TBB_LABEL,
    icons: {
      "default": "icon"
    },
    oncommand: showYoudaoTranslator
  });

  try {
    let jsm = {};
    Cu.import('resource://cmtracking/ExtensionUsage.jsm', jsm);
    jsm.ExtensionUsage.register(buttonId, 'window:button',
      'youdao-translate@mozillaonline.com');
  } catch(e) {};

  let display = prefs.get('extensions.mozcn-translation.display', 'ask');
  tracker.track({
    event: 'browserStarted',
    display: display
  });

  tabs.on('pageshow', refreshButton);
  tabs.on('activate', refreshButton);
  refreshButton(tabs.activeTab);

  // Only enable language detection once.
  if (!prefs.get('extensions.mozcn-translation.initialized', false)) {
    prefs.set('browser.translation.detectLanguage', true);
    prefs.set('extensions.mozcn-translation.initialized', true);
  }

  let uri = Services.io.newURI('chrome://mozcn-translation/skin/translation.css', null, null);
  let ss = Cc['@mozilla.org/content/style-sheet-service;1'].
             getService(Ci.nsIStyleSheetService);
  ss.loadAndRegisterSheet(uri, ss.USER_SHEET);

  let globalMM = Cc['@mozilla.org/globalmessagemanager;1']
    .getService(Ci.nsIMessageListenerManager);
  globalMM.addMessageListener('Translation:DocumentState', messageListener);

  require('sdk/system/unload').when(function() {
    globalMM.removeMessageListener('Translation:DocumentState', messageListener);

    if(ss.sheetRegistered(uri, ss.USER_SHEET)) {
      ss.unregisterSheet(uri, ss.USER_SHEET);
    }

    // Remove all notifications on unload
    for (let win of windows.browserWindows) {
      let gBrowser = viewFor(win).gBrowser;
      for (let tab of gBrowser.tabs) {
        let notif = gBrowser.getNotificationBox(tab.linkedBrowser);
        let notification = notif.getNotificationWithValue('mozcn-translation');
        if (notification) {
          notif.removeNotification(notification);
        }
      }
    }
  });
};
