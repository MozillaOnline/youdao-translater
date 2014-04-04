/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const {Cc, Ci, Cu} = require('chrome');
const winUtils     = require('sdk/window/utils');
const self         = require('sdk/self');
const data         = require('sdk/self').data;
const platform     = require('sdk/system').platform;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');

XPCOMUtils.defineLazyModuleGetter(this,
  'CustomizableUI', 'resource:///modules/CustomizableUI.jsm');

let STYLE_TEMPLATE =
  '  /* styles for button on toolbar with bright theme */\n' +
  '  #__id____status__ {\n' +
  '    list-style-image: url("__icon__brightTheme__") !important;\n' +
  '  }\n' +
  '  #__id____status__:active {\n' +
  '    list-style-image: url("__icon__active__brightTheme__") !important;\n' +
  '  }\n' +
  '  /* styles for button on toolbar with dark theme */\n' +
  '  #__id__[cui-areatype="toolbar"]__status__:not([overflowedItem=true]):-moz-lwtheme-brighttext {\n' +
  '    list-style-image: url("__icon__darkTheme__") !important;\n' +
  '  }\n' +
  '  #__id__[cui-areatype="toolbar"]__status__:not([overflowedItem=true]):-moz-lwtheme-brighttext:active {\n' +
  '    list-style-image: url("__icon__active__darkTheme__") !important;\n' +
  '  }\n' +
  '  /* styles for button on menu panel */\n' +
  '  #__id__[cui-areatype="menu-panel"]__status__,\n' +
  '  toolbarpaletteitem[place="palette"] > #__id____status__ {\n' +
  '    list-style-image: url("__icon__32__brightTheme__") !important;\n' +
  '  }\n';

let buttonId = null;
let buttonIcons = null;
let buttonLabel = null;
let buttonArea = null;
let onCommand = null;
let currentStatus = '';

function updateAllIcons(name) {
  currentStatus = name;
  winUtils.windows().forEach(function(window) {
    let button = window.document.getElementById(buttonId);
    if (button) {
      button.setAttribute('data-status', name);
    }
  });
}

function getStyleSheet() {
  let styles = [];
  styles.push('@-moz-document url("chrome://browser/content/browser.xul") {');

  function getIcon(status, themeStyle, size, active) {
    // Pick icons for mac.
    if (platform.toLowerCase() == 'darwin') {
      // Only mac has :active styles.
      if (active) {
        return data.url(themeStyle + '/mac/' + buttonIcons[status] + '-' + size + '-active.png');
      } else {
        return data.url(themeStyle + '/mac/' + buttonIcons[status] + '-' + size + '.png');
      }
    }

    return data.url(themeStyle + '/' + buttonIcons[status] + '-' + size + '.png');
  }

  // Generate style rules for each status.
  Object.keys(buttonIcons).forEach(function(status) {
    let icons = buttonIcons[status];
    let s = STYLE_TEMPLATE.replace(/__id__/g, buttonId).
      replace(/__status__/g, status == 'default' ? '' : '[data-status="' + status + '"]').
      replace(/__icon__brightTheme__/g, getIcon(status, 'brighttheme', 16)).
      replace(/__icon__active__brightTheme__/g, getIcon(status, 'brighttheme', 16, true)).
      replace(/__icon__darkTheme__/g, getIcon(status, 'darktheme', 16)).
      replace(/__icon__active__darkTheme__/g, getIcon(status, 'darktheme', 16, true)).
      replace(/__icon__32__brightTheme__/g, getIcon(status, 'brighttheme', 32));
    styles.push(s);
  });

  styles.push('}');

  return 'data:text/css;charset=utf-8,' + encodeURIComponent(styles.join('\n'));
}

function addButton() {
  CustomizableUI.createWidget({
    id: buttonId,
    label: buttonLabel,
    defaultArea: buttonArea,
    tooltiptext: buttonLabel,
    onCommand: onCommand
  });

  // Hack css
  let io = Cc["@mozilla.org/network/io-service;1"].
             getService(Ci.nsIIOService);
  let ss = Cc["@mozilla.org/content/style-sheet-service;1"].
             getService(Ci.nsIStyleSheetService);
  let uri = io.newURI(getStyleSheet(), null, null);
  ss.loadAndRegisterSheet(uri, ss.USER_SHEET);

  console.log('Register style sheet done.');
  // Remove widget and style sheet when unload module
  require('sdk/system/unload').when(function() {
    CustomizableUI.destroyWidget(buttonId);
    if(ss.sheetRegistered(uri, ss.USER_SHEET)) {
      ss.unregisterSheet(uri, ss.USER_SHEET);
    }
  });
}

function showPanelWithButton(p) {
  let win = winUtils.getMostRecentBrowserWindow();
  let doc = win.document;

  // If account button is not in toolbar, which means it's hidden in menu
  // panel or additional panel, we use PanelUI-menu-button as the panel anchor
  let areaType = CustomizableUI.getWidget(buttonId).areaType;

  let button = areaType == 'toolbar' ?
    win.document.getElementById(buttonId) :
    win.document.getElementById('PanelUI-menu-button');

  // FIXME Passing a DOM node to Panel.show() method is an unsupported feature
  // that will be soon replaced. See: https://bugzilla.mozilla.org/show_bug.cgi?id=878877
  p.show(button);
}

// Make sure new opened window has the right icon.
require('sdk/windows').browserWindows.on('open', function(window) {
  updateAllIcons(currentStatus);
});

/**
 * icons = {
 *   'default': {
 *     'brightTheme': {
 *       '16': 'offline-light.png',  // icon on toolbar
 *       '32': 'offline-light-32.png' // icon on menu panel
 *     },
 *
 *     'darkTheme': {
 *       '16': 'offline.png', // icon on toolbar
 *     }
 *   },
 *
 *   'online': {
 *     'darkTheme': {
 *       '16': 'online.png',
 *     }
 *   }
 * };
 */
exports.init = function({id, oncommand, icons, label, area}) {
  if (buttonId) {
    throw new Error('Widget is already initalized.');
    return;
  }

  buttonIcons = icons;
  buttonId = id;
  onCommand = oncommand;
  buttonLabel = label;
  buttonArea = area || CustomizableUI.AREA_NAVBAR;

  addButton();
};

exports.showPanel = function(panel) {
  showPanelWithButton(panel);
};

exports.changeIcon = updateAllIcons;
