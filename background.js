const INACTIVE = "inactive";
const STARTUP = "startup";

const LOCAL_STORAGE_QUOTA_BYTES = 5242880;
const LOCAL_STORAGE_QUOTA_CLEANUP = 4718592; // 90%

const LOG_STORAGE_KEY = 'log'
let logService = initAsyncStorage('log');
const debug = false;

// ON WINDOW FOCUS CHANGED
chrome.windows.onFocusChanged.addListener((windowId) => {
    if (chrome.windows.WINDOW_ID_NONE == windowId) {
        log('focus out')
        registerHost(INACTIVE)
    } else {
        log('focus in')
        registerActiveTab();
    }
})

// ON TAB ACTIVATED
chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, async (tab) => {
        if (chrome.runtime.lastError && chrome.runtime.lastError.message === 'No tab with id: ' + activeInfo.tabId + '.' || !tab) {
            // probably tab was immedeately closed
        } else {
            log('tab activated', getTabHostname(tab))
            registerHost(getTabHostname(tab))
        }

    });
});

// ON TAB URL UPDATED
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    let urlChanged = changeInfo.hasOwnProperty('url');
    let url = changeInfo.url;
    let active = tab.active;

    if (active && urlChanged) {
        log('tab url updated', getUrlHostname(url))
        registerHost(getUrlHostname(url))
    }
})

// ON WINDOW CLOSED
chrome.windows.onRemoved.addListener((id) => {
    log('window closed', getTabHostname(tab))
    registerHost(INACTIVE)
});

// HANDLE BROWSER CLOSE
const ALARM_NAME = "HANDLE BROWSER CLOSE";
chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: 1,
    when: Date.now() + 100

})
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name == ALARM_NAME) {
        registerOnline();
    }
})

// chrome.runtime.onStartup.addListener(() => {
//     registerService(STARTUP)  // <<<<<<<<<<<<<<<<<<<<<< TODO on start set proper time based p? 
// })

// manage storage space left by deleting old records
function cleanupOldData() {
    chrome.storage.local.getBytesInUse((bytes) => {
        if (bytes > LOCAL_STORAGE_QUOTA_CLEANUP) {
            logService((list, lastOnline) => {
                let totalItems = list && list.length || 0;
                let deleteItems = Math.floor(totalItems * 0.05);
                list.splice(0, deleteItems)
            });
        }
    })

}

function initAsyncStorage (storageKey) {
    var items = [];

    var publishItems = function (storageData) {
        var tasks = storageData[LOG_STORAGE_KEY] || [];
        let lastOnline = storageData['lastOnline'];

        pushItemsToTheList(tasks, items, lastOnline);

        chrome.storage.local.set({ [`${storageKey}`]: tasks, 'lastOnline': Date.now() }, function () {
            itemsWritten(items.length);
        });
    };

    var itemsWritten = function (nComplete) {
        items = items.slice(nComplete);
        if (items.length) {
            chrome.storage.local.get(storageKey, publishItems);
        }
    };

    return function (item) {
        cleanupOldData()
        if (items.push(item) === 1) {
            chrome.storage.local.get([storageKey, 'lastOnline'], publishItems);
        }
    };
}

function pushItemsToTheList(list, newItems, lastOnline) {
    list = list || [];
    let prev = list.length ? list[list.length - 1] : undefined;
    for (let i = 0; i < newItems.length; i++) {
        let newItem = newItems[i];

        if (newItem && newItem instanceof Function) {
            newItem(list, lastOnline)
        } else if (newItem && (!prev || newItem[0] != prev[0])) {
            let isStartup = newItem[0] === STARTUP;
            if (isStartup && prev && lastOnline) {
                list.push([INACTIVE, lastOnline]);
            } else {
                list.push(newItem)
                prev = newItem
            }

        }
    }
}

//engine
function registerHost(host) {
    let time = Date.now();
    logService([host, time]);

}

function registerService(service) {
    let time = Date.now();
    logService([service, time]);
}

function registerOnline() {
    logService(undefined);
}

function registerActiveTab() {
    getActiveTab()
        .then(tab => registerHost(getTabHostname(tab)))
        .catch(er => registerHost('Unable to get tab'))
}

// utils
const getTabHostname = (tab) => {
    if (!tab || !tab.url) return INACTIVE;
    return getUrlHostname(tab.url);
}

const getUrlHostname = (url) => {
    if (!url) return INACTIVE;
    if (url.startsWith('chrome://')) return 'chrome://' + new URL(url).hostname;
    return new URL(url).hostname;
}

async function getActiveTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

function log(...args){
    if (debug){
        console.log(arguments);
    }
}
