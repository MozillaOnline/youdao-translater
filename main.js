

/*---------- Initial ----------*/
// update when the extension loads initially
autoShowYoudaoTranslator();


/*--------- Changing ----------*/
//Changing button
function refreshButton(currentTab){
  if (currentTab.url.indexOf('http://') == 0) {
    browser.browserAction.setIcon({
      path: "button/icon-16-active.png",
      tabId: currentTab.id
    });
    browser.browserAction.enable();
  }
  else {
    browser.browserAction.setIcon({
      path: "button/icon-16.png",
      tabId: currentTab.id
    });
    browser.browserAction.disable();
  }
}


//Show Youdao Translator
function showYoudaoTranslator() {
  browser.tabs.executeScript({
    file: "youdao.js"
  });
}

//Auto show Youdao Translator
function autoShowYoudaoTranslator(tabs) {

  function updateTab(tabs) {
    if (tabs[0]) {
      currentTab = tabs[0];
      refreshButton(currentTab);

      var currentURL = currentTab.url;
      var detecting = browser.tabs.detectLanguage();
      var currentOption =  browser.storage.local.get("opt");

      currentOption.then( function(currentOPT) {
        detecting.then( function (currentLANG) {
          if(currentOPT.opt == "autoshow" && currentLANG == "en" && currentTab.url.indexOf('http://') == 0){
            showYoudaoTranslator();
          }
        });
      });
    }
  }

  var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
  gettingActiveTab.then(updateTab);

}



// listen to tab URL changes
browser.tabs.onUpdated.addListener(autoShowYoudaoTranslator);

// listen to tab switching
browser.tabs.onActivated.addListener(autoShowYoudaoTranslator);

// listen to tab creating
browser.tabs.onCreated.addListener(autoShowYoudaoTranslator);

// listen to button clicking
browser.browserAction.onClicked.addListener(showYoudaoTranslator);
