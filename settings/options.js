//Initial
restoreOptions();


//
function onError(error) {
  console.log(`Error: ${error}`);
}

// Save option
function saveOptions() {
  if(document.querySelector('#autoShow').checked  == true) {
    browser.storage.local.set({opt: "autoshow"});
    console.log("Auto Show");
  }
  else {
    browser.storage.local.set({opt: "default"});
    console.log("Default: Click to Show");
  }
}

//Get current option
function restoreOptions() {
  function setCurrentOptions(result){
    if ( !result.opt ) {
      browser.storage.local.set({opt: "default"});
      document.getElementById("autoShow").checked = false;
    }
    else if ( result.opt  == "autoshow") {
      document.getElementById("autoShow").checked = true;
    }
    else {
      document.getElementById("autoShow").checked = false;
    }
  }

  var getting = browser.storage.local.get("opt");

  getting.then(setCurrentOptions,onError);
}


//
document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("input", saveOptions);
