const options = {};
const conversionDisabledText = '❌ conversion disabled';
const conversionEnabledText = '✔ conversion enabled';
const useNotRedemptionPriceText = 'use uni v3 rai/dai';
const useRedemptionPriceText = 'use redemption price';
const format3 = {minimumFractionDigits: 3, maximumFractionDigits: 3};
const format4 = {minimumFractionDigits: 4, maximumFractionDigits: 4};
let url;

const blacklistToggle = document.getElementById("blacklist_toggle");
const globalToggle = document.getElementById("global_toggle");
const useRedemptionPrice = document.getElementById("use_redemption_price");
const digitsNumber = document.getElementById("digits_number");
const digitsControl = document.getElementById("digits_control");
const highlight = document.getElementById("highlight");
const badgePrice = document.getElementById("badge_price");
const raiPrice = document.getElementById("rai_price");
const daiPrice = document.getElementById("dai_price");
const redemptionPrice = document.getElementById("redemption_price");
const redemptionRate = document.getElementById("redemption_rate");

window.addEventListener('DOMContentLoaded', onLoad);

blacklistToggle.addEventListener('click', onBlacklist);
globalToggle.addEventListener('click', onGlobal);
useRedemptionPrice.addEventListener('click', onRedemptionPrice);
digitsControl.addEventListener('input', onDigits);
highlight.addEventListener('click', onHighlight);
badgePrice.addEventListener('click', onBadge);


function onBlacklist(event) {
  if (!options.conversionEnabled) {
    return;
  }
  options.blacklist[url] = !options.blacklist[url];
  blacklistToggle.textContent = options.blacklist[url] ? conversionDisabledText : conversionEnabledText;
	chrome.storage.sync.set({options: options});
}

function onGlobal(event) {
  options.conversionEnabled = !options.conversionEnabled;
  blacklistToggle.textContent = getBlacklistText();
  globalToggle.textContent = options.conversionEnabled ? conversionEnabledText : conversionDisabledText;
	chrome.storage.sync.set({options: options});
}

function onRedemptionPrice(event) {
  options.useRedemptionPrice = !options.useRedemptionPrice;
  useRedemptionPrice.textContent = options.useRedemptionPrice ? useRedemptionPriceText : useNotRedemptionPriceText;
	chrome.storage.sync.set({options: options});
}

function onDigits(event) {
  options.digits = digitsControl.value;
  digitsNumber.textContent = options.digits;
	chrome.storage.sync.set({options: options});
}

function onHighlight(event) {
  options.highlightEnabled = highlight.checked;
	chrome.storage.sync.set({options: options});
}

function onBadge(event) {
  options.priceOnBadge = badgePrice.checked;
  digitsNumber.textContent = options.digits;
	chrome.storage.sync.set({options: options});
}

function getBlacklistText() {
  if (!options.conversionEnabled) {
    blacklistToggle.classList.remove("button_hover");
    return '-';
  }
  blacklistToggle.classList.add("button_hover");
  return options.blacklist[url] ? conversionDisabledText : conversionEnabledText;
}

function writePrices(prices) {
  raiPrice.textContent = '1 RAI = ' + prices.marketPriceRaiInDai.toLocaleString(undefined, format3) + ' DAI';
  daiPrice.textContent = '1 DAI = ' + prices.marketPriceDaiInRai.toLocaleString(undefined, format3) + ' RAI';
  redemptionPrice.textContent = prices.redemptionPrice.toLocaleString(undefined, format4);
  redemptionRate.textContent = prices.redemptionRate.toLocaleString(undefined, format3) + '%';
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
    Object.assign(options, data.options);
    globalToggle.setAttribute('enabled', data.options.conversionEnabled);
    globalToggle.textContent = !data.options.conversionEnabled ? conversionDisabledText : conversionEnabledText;
    blacklistToggle.textContent = getBlacklistText()
    useRedemptionPrice.setAttribute('enabled', data.options.useRedemptionPrice);
    useRedemptionPrice.textContent = data.options.useRedemptionPrice ? useRedemptionPriceText : useNotRedemptionPriceText;
    digitsNumber.textContent = data.options.digits;
    digitsControl.setAttribute('value', data.options.digits);
    highlight.checked = data.options.highlightEnabled;
    badgePrice.checked = data.options.priceOnBadge;
    writePrices(data.prices);
  });
}