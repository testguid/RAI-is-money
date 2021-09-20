const options = {};
const conversionDisabledText = '❌ conversion disabled';
const conversionEnabledText = '✔ conversion enabled';
const extensionDisabled = '❌ extension disabled';
const extensionEnabled = '✔ extension enabled';
const useNotRedemptionPriceText = 'use uni v3 rai/dai';
const useRedemptionPriceText = 'use redemption price';
const format3 = { minimumFractionDigits: 3, maximumFractionDigits: 3 };
const format4 = { minimumFractionDigits: 4, maximumFractionDigits: 4 };
let url;

const blacklistToggle = document.getElementById("blacklist_toggle");
const globalToggle = document.getElementById("global_toggle");
const useRedemptionPrice = document.getElementById("use_redemption_price");
const highlight = document.getElementById("highlight");
const badgePrice = document.getElementById("badge_price");
const raiPrice = document.getElementById("rai_price");
const daiPrice = document.getElementById("dai_price");
const redemptionPrice = document.getElementById("redemption_price");
const redemptionRate = document.getElementById("redemption_rate");
const pricesDisplay = document.getElementById("prices_list");
const advancedToggle = document.getElementById("advancedToggle");
const advanced = document.getElementById("advanced");

window.addEventListener('DOMContentLoaded', onLoad);

blacklistToggle.addEventListener('click', onBlacklist);
globalToggle.addEventListener('click', onGlobal);
useRedemptionPrice.addEventListener('click', onRedemptionPrice);
highlight.addEventListener('click', onHighlight);
badgePrice.addEventListener('click', onBadge);
advancedToggle.addEventListener('click', onAdvanced);

function onBlacklist(event) {
    if (!options.conversionEnabled) {
        return;
    }
    options.blacklist[url] = !options.blacklist[url];
    blacklistToggle.textContent = options.blacklist[url] ? conversionDisabledText : conversionEnabledText;
    chrome.storage.sync.set({ options: options });
}

function onGlobal(event) {
    options.conversionEnabled = !options.conversionEnabled;
    blacklistToggle.textContent = getBlacklistText();
    globalToggle.textContent = options.conversionEnabled ? extensionEnabled : extensionDisabled;
    chrome.storage.sync.set({ options: options });
}

function onRedemptionPrice(event) {
    options.useRedemptionPrice = !options.useRedemptionPrice;
    useRedemptionPrice.textContent = options.useRedemptionPrice ? useRedemptionPriceText : useNotRedemptionPriceText;
    chrome.storage.sync.set({ options: options });
}

function onHighlight(event) {
    options.highlightEnabled = highlight.checked;
    chrome.storage.sync.set({ options: options });
}

function onBadge(event) {
    options.priceOnBadge = badgePrice.checked;
    chrome.storage.sync.set({ options: options });
}

function getBlacklistText() {
    if (!options.conversionEnabled) {
        blacklistToggle.classList.remove("button_hover");
        return '-';
    }
    blacklistToggle.classList.add("button_hover");
    return options.blacklist[url] ? conversionDisabledText : conversionEnabledText;
}

function onAdvanced(event) {
    options.advanced = !options.advanced;
    if (options.advanced) {
        advanced.classList.remove("hide");
    } else {
        advanced.classList.add("hide");
    }
    chrome.storage.sync.set({ options: options });
}

function writePrices(prices) {
    raiPrice.textContent = '1 RAI = ' + prices.marketPriceRaiInDai.toLocaleString(undefined, format3) + ' DAI';
    daiPrice.textContent = '1 DAI = ' + prices.marketPriceDaiInRai.toLocaleString(undefined, format3) + ' RAI';
    redemptionPrice.textContent = prices.redemptionPrice.toLocaleString(undefined, format4);
    redemptionRate.textContent = prices.redemptionRate.toLocaleString(undefined, format3) + '%';
    
    for (const entry of Object.entries(displayNames)) {
        const listItem = document.createElement('li');
        console.log(`RAI / ${entry[1]}: ${prices.priceDivisors[entry[0]].toLocaleString(undefined, format3)}`)
        listItem.textContent = `RAI / ${entry[1]}: ${prices.priceDivisors[entry[0]].toLocaleString(undefined, format3)}`;
        pricesDisplay.appendChild(listItem);
    }
}

function onLoad() {
    getPrices().then(writePrices)
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {
        url = new URL(tabs[0].url).hostname;
        document.getElementById("current_url").textContent = url;
    });

    chrome.storage.sync.get(null, (data) => {
        console.log(options)
        Object.assign(options, data.options);
        globalToggle.setAttribute('enabled', data.options.conversionEnabled);
        globalToggle.textContent = !data.options.conversionEnabled ? extensionDisabled : extensionEnabled;
        blacklistToggle.textContent = getBlacklistText()
        useRedemptionPrice.setAttribute('enabled', data.options.useRedemptionPrice);
        useRedemptionPrice.textContent = data.options.useRedemptionPrice ? useRedemptionPriceText : useNotRedemptionPriceText;
        highlight.checked = data.options.highlightEnabled;
        badgePrice.checked = data.options.priceOnBadge;
        if (options.advanced) {
            advanced.classList.remove("hide");
        } else {
            advanced.classList.add("hide");
        }    
    });
}