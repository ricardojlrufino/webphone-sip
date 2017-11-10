
var popup = null;
var WEBPHONE_DEV = "http://localhost:5000/index.src.html";
var WEBPHONE_PROD = "https://ricardojlrufino.github.io/webphone-sip";
var WEBPHONE_URL = WEBPHONE_PROD;
var ENABLE_LOG = (WEBPHONE_URL == WEBPHONE_DEV);


chrome.browserAction.onClicked.addListener(function (tab) {
    createPopup();
});

chrome.contextMenus.create({
    title: chrome.i18n.getMessage("call_action"), 
    contexts:["selection"], 
    onclick: function(info, tab) {
        onPhoneClick(info.selectionText);
    }
});

chrome.runtime.onMessage.addListener(
function(event, sender, sendResponse) {
    if( event.type === "WEBPHONE_ONCLICK" ) {
        onPhoneClick(event.tel);
    }
}
);

function onPhoneClick(phone){
    createPopup(function(){
        chrome.tabs.query({'windowId': popup}, function (result) {
          if(ENABLE_LOG) console.log("Inserting phone... " + popup);
          var sc = "document.getElementById('phoneNumber').value = '" +phone + "';";
          chrome.tabs.executeScript(result[0].id, {"code": sc});
        });
    });
}

function createPopup(callback){

    if(popup == null){
        var cfg = {
            url: WEBPHONE_URL,
            width: 348,
            height: 480,
            focused: true,
            type: "panel",
            state: "docked"
        };

        chrome.windows.create(cfg, function createWindow(window) {
            popup = window.tabs[0].windowId;
            if(ENABLE_LOG) console.log("WebPhone Popup Created");
            if(callback) callback();
        });
    }else{
        chrome.windows.update(popup, {focused: true});
        if(callback) callback();
    }
    
}

chrome.windows.onRemoved.addListener(function (window) {
    popup = null;
    if(ENABLE_LOG) console.log("WebPhone Closed");
});
