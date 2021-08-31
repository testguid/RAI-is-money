const defaultOptions = {
    blacklist: {},
    conversionEnabled: true,
    useRedemptionPrice: false,
    digits: 3,
    highlightEnabled: true,
    refreshInterval: 30,
    priceOnBadge: true
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!request.updateBadge) {
        return;
    }
    chrome.storage.sync.get(null, updateBadgeWithConversionPrice);
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ options: defaultOptions });
    sendRequestPriceUpdateMessage()
});

function updateBadge(price) {
    chrome.action.setBadgeText({
        text: price.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
    });
    chrome.action.setBadgeBackgroundColor(
        { color: 'black' }
    );
}

function updateBadgeWithConversionPrice(storage) {
    if (!storage.prices) {
        return;
    }
    if (!storage.options.priceOnBadge) {
        chrome.action.setBadgeText({
            text: ''
        });
        return;
    }
    if (storage.options.useRedemptionPrice) {
        updateBadge(storage.prices.redemptionPrice);
        return;
    }
    updateBadge(storage.prices.marketPriceRaiInDai);
}

function sendRequestPriceUpdateMessage() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        console.log('sending message')
        if (!tabs[0]) {
            return;
        }
        chrome.tabs.sendMessage(tabs[0].id, { requestPriceUpdate: true }, response => { });
    });
}

chrome.alarms.onAlarm.addListener(sendRequestPriceUpdateMessage);

chrome.alarms.create('update', { delayInMinutes: defaultOptions.refreshInterval, periodInMinutes: defaultOptions.refreshInterval });

chrome.storage.onChanged.addListener(function (changes, namespace) {
    console.log(changes)
    chrome.storage.sync.get(null, updateBadgeWithConversionPrice);
});