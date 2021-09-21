const indicators = {
    usd: {
        textSymbols: [/(?:United\s*States\s*|US\s*|U\.S\.\s*)?Dollars?/, /USD?(?!\s*(?:DAI|COIN|USDT))/],
        symbol: /\$/
    },
    eur: {
        textSymbols: [/EUR/, /euros?/],
        symbol: /€/
    },
    gbp: {
        textSymbols: [/GBP/, /british\s*pounds?/],
        symbol: /£/
    },
    cny: {
        textSymbols: [/CNY?/, /CNH/, /yuan/, /RMB/, /renminbi/, /元/],
        symbol: /¥/
    },
    jpy: {
        textSymbols: [/JPY?/, /(?:(?:JPY?|japanese)\s*)?yen/, /円/],
        symbol: /¥/
    },
    krw: {
        textSymbols: [/KRW/, /(?:south\s*)?(?:korean\s*)?won/],
        symbol: /₩/
    },
    inr: {
        textSymbols: [/INR/, /(?:indian\s*)?rupees?/],
        symbol: /₹/
    },
    usdc: {
        textSymbols: [/USDC/],
        name: 'usd-coin'
    },
    dai: {
        textSymbols: [/DAI(?!\s*DAI)/]
    },
    tether: {
        textSymbols: [/USDT(?!\s*USDT)/]
    },
    nusd: {
        textSymbols: [/sUSD(?!\s*sUSD)/]
    },
    terrausd: {
        textSymbols: [/UST/]
    },
    pusd: {
        textSymbols: [/paxos/, /PAX/, /USDP/],
        name: 'paxos-standard'
    },
    busd: {
        textSymbols: [/BUSD/],
        name: 'binance-usd'
    },
    lusd: {
        textSymbols: [/LUSD/],
        name: 'liquity-usd'
    },
    float: {
        textSymbols: [/float/],
        name: 'float-protocol-float'
    }
}

const decimalNames = ['negation', 'amount', 'thousandsMark', 'decimalMark', 'amountPostfix', 'decimals'];
const decimal = /(?<negation>-\s*)?(?<amount>(?:(?:\d{1,3}){1})(?:(?:(?<thousandsMark>[\s|\.|\,])\d{3}|\d)*)(?:(?<decimalMark>[\.|\,])(?<decimals>\d+))?)(?:\s*(?<amountPostfix>k|mm?|b|t)(?![a-z0-9]))?/
const st = /(?<!(?:RAI\s*)|[\[\]\<\>a-z0-9]|[\,\.][0-9])/
const end = /(?!(?:\s*RAI)|[\[\]\<\>a-z0-9]|[\,\.][0-9])/
const rPre = `${st.source}(?:(?:${buildIndicators('Pre')})\\s*)${decimal.source}(?:\\s*(?:${buildIndicators('Post')}))?${end.source}`;
const rPost = `${st.source}(?:(?:${buildIndicators('Pre')})\\s*)?${decimal.source}(?:\\s*(?:${buildIndicators('Post')}))${end.source}`;
console.log(new RegExp(rPre, 'igm'))
console.log(new RegExp(rPost, 'igm'))
const globalRegexPre = new RegExp(rPre, 'igm');
const globalRegexPost = new RegExp(rPost, 'igm');
const regexPre = new RegExp(rPre, 'im');
const regexPost = new RegExp(rPost, 'im');

function buildIndicators(keySuffix) {
    return Object.entries(indicators)
        .map(entry => buildIndicator(entry, keySuffix))
        .join('|');
}

function buildIndicator(entry, keySuffix) {
    let name = entry.name || entry[0];
    let captureGroup = [`(?<${name}${keySuffix}>`];
    let patterns = [];
    if (entry[1].symbol) {
        patterns.push(entry[1].symbol.source);
        for (const textSymbol of entry[1].textSymbols) {
            patterns.push(`(?:${entry[1].symbol.source}\\s*)?${textSymbol.source}(?:\\s*${entry[1].symbol.source})?`);
        }
    } else {
        for (const textSymbol of entry[1].textSymbols) {
            patterns.push(`${textSymbol.source}`);
        }
    }
    captureGroup.push(patterns.join('|'));
    captureGroup.push(')');
    return captureGroup.join('');
}

const shadow = `green 2px 0px 2px, green -2px 0px 2px, green 4px 0px 6px, green -4px 0px 6px`;
const elementMap = new Map();
const options = {};
const prices = {};

let highlightEnabled = false;

function highlight(element, elementData) {
    if (!element || !options.highlightEnabled) {
        return;
    }
    if (!element.style) {
        if (!element.parentNode || !element.parentNode.style) {
            return;
        }
        element = element.parentNode;
    }
    if (elementData.color === undefined) {
        elementData.color = element.style.textShadow;
    }
    element.style.textShadow = shadow;
    setTimeout(() => element.style.textShadow = elementData.color, 600);
}

function replaceInTextNode(node, replacerFunction) {
    let newText = node.textContent.replace(globalRegexPre, replacerFunction);
    if (newText !== node.textContent) {
        if (!elementMap.has(node)) {
            elementMap.set(node, {});
        }
        let elementData = elementMap.get(node);
        elementData.originalText = node.textContent;
        elementData.newText = newText;
        elementData.conversion = true;
        node.textContent = newText;
    }
    newText = node.textContent.replace(globalRegexPost, replacerFunction);
    if (newText !== node.textContent) {
        if (!elementMap.has(node)) {
            elementMap.set(node, {});
        }
        let elementData = elementMap.get(node);
        elementData.originalText = node.textContent;
        elementData.newText = newText;
        elementData.conversion = true;
        node.textContent = newText;
    }
    if (highlightEnabled && node.textContent !== elementData.originalText) {
        highlight(node, elementData);
    }
}

function replaceInText(element, replacerFunction) {
    for (let node of element.childNodes) {
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                replaceInText(node, replacerFunction);
                break;
            case Node.TEXT_NODE:
                replaceInTextNode(node, replacerFunction);
                break;
            case Node.DOCUMENT_NODE:
                replaceInText(node, replacerFunction);
        }
    }
    if (element.textContent.match(regexPre) || element.textContent.match(regexPost)) {
        replaceInTextNode(element, replacerFunction);
    }
}

async function startReplace(storage) {
    Object.assign(options, storage.options);
    Object.assign(prices, storage.prices);
    if (conversionsDisabled()) {
        return;
    }
    chrome.runtime.sendMessage({ updateBadge: true }, function () { });
    const replacerFunction = getReplacerFunction();
    replaceAndObserve(document, replacerFunction);
}

function start() {
    chrome.storage.sync.get(null, startReplace);
}

function handleMutations(mutations) {
    for (const mutation of mutations) {
        if (mutation.target.textContent) {
            replaceInText(mutation.target, getReplacerFunction());
        }
    }
}

function replaceAndObserve(document, replacerFunction) {
    replaceInText(document.body, replacerFunction);
    observe(handleMutations, document.body, { childList: true, subtree: true, characterData: true });
}

let observer = undefined;
function observe(callback, element, options) {
    observer = new MutationObserver(callback);
    observer.observe(element, options);
}

function getReplacerFunction() {
    return function (...params) {
        let groups = params.pop();
        for (const entry of Object.entries(groups)) {
            if (!entry[1] || decimalNames.includes[entry[0]]) {
                continue;
            }
            let key = entry[0].replace(/Pre|Post/, '');
            if (indicators[key]) {
                return captureConversion(groups, prices.priceDivisors[indicators[key].name || key]);
            }
        }
    }
}

function captureConversion(groups, priceDivisor) {
    if (!groups.amount || typeof parseFloat(groups.amount) !== 'number') {
        return;
    }
    let num = groups.amount;
    if (groups.decimalMark === ',' || groups.thousandsMark === '.') {
        num = num.replace(/[\s|\.]/g, '');
        num = num.replace(/\,]/g, '.');        
    } else {
        if (num.charAt(0) === '0' && !groups.decimalMark) {
            groups.decimalMark = num.charAt(1);
            num = num.replace(/[\s|\,]/g, '.');
        } else {
            num = num.replace(/[\s|\,]/g, '');
        }
    }
    num = parseFloat(num) / priceDivisor;
    let postfix = '';
    if (groups.amountPostfix) {
        postfix = groups.amountPostfix;
    }
    let digits = groups.decimals?.length || 0;
    if (num < 1 && groups.amount.length > 1) {
        digits = groups.amount.length - 2;
    }
    if (num < 1 && digits === 0) {
        digits = 1;
    }
    let result = num.toLocaleString('en-US',{ minimumFractionDigits: digits, maximumFractionDigits: digits });
    if (groups.thousandsMark) {
        result = result.replace(/\,/g, groups.thousandsMark);
    }
    if (groups.decimalMark) {
        result = result.replace(/\.(?!.*\.)/g, groups.decimalMark);
    }
    return result + postfix + ' RAI';
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!request.requestPriceUpdate) {
        return;
    }
    getPrices();
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (!changes.options) {
        return;
    }
    Object.assign(options, changes.options.newValue);
    if (conversionsDisabled()) {
        observer.disconnect();
        elementMap.forEach(setOriginalText);
        return;
    }
    elementMap.forEach(setConversionText);
    start();
});

function conversionsDisabled() {
    return options.blacklist[window.location.hostname] || !options.conversionEnabled;
}

function setOriginalText(value, key, map) {
    key.textContent = value.originalText;
}

function setConversionText(value, key, map) {
    key.textContent = value.newText;
}

start();


