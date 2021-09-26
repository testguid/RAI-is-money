const indicators = {
    usd: {
        textSymbols: [/(?:United\s*States\s*|US\s*|U\.S\.\s*)?Dollars?/, /USD?/],
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
        textSymbols: [/DAI/]
    },
    tether: {
        textSymbols: [/USDT/]
    },
    nusd: {
        textSymbols: [/sUSD/]
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
const st = /(?<![%\[\]\<\>a-z0-9]|[\,\.][0-9])/
const end = /(?![%\[\]\<\>a-z0-9]|[\,\.][0-9])/
const rPre = `${st.source}(?:(?:${buildIndicators('Pre')})\\s*)${decimal.source}(?:\\s*(?:${buildIndicators('Post')}))?${end.source}`;
const rPost = `${st.source}(?:(?:${buildIndicators('Pre')})\\s*)?${decimal.source}(?:\\s*(?:${buildIndicators('Post')}))${end.source}`;
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

function highlight(element, elementData) {
    if (!element || !element.style || !options.highlightEnabled || elementData.highlightOngoing) {
        return;
    }
    elementData.highlightOngoing = true;
    elementData.color = element.style.textShadow;
    element.style.textShadow = shadow;
    setTimeout(() => endHighlight(element, elementData), 600);
}

function endHighlight(element, elementData) {
    elementData.highlightOngoing = false;
    element.style.textShadow = elementData.color;
}

function replaceInTextNode(node) {
    if (NON_PROSE_ELEMENTS[node.tagName?.toLowerCase()]) {
        return;
    }
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
        highlight(node, elementData);
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
        highlight(node, elementData);
    }
}

const NON_PROSE_ELEMENTS = {
    br:1, hr:1,
    script:1, style:1, img:1, video:1, audio:1, canvas:1, svg:1, map:1, object:1,
    textarea:1
};

const NON_CONTIGUOUS_PROSE_ELEMENTS = {
    // Elements that will not contain prose or block elements where we don't
    // want prose to be matches across element borders:

    // Block Elements
    address:1, article:1, aside:1, blockquote:1, dd:1, div:1,
    dl:1, fieldset:1, figcaption:1, figure:1, footer:1, form:1, h1:1, h2:1, h3:1,
    h4:1, h5:1, h6:1, header:1, hgroup:1, hr:1, main:1, nav:1, noscript:1, ol:1,
    output:1, p:1, pre:1, section:1, ul:1,
    // Other misc. elements that are not part of continuous inline prose:
    br:1, li: 1, summary: 1, dt:1, details:1, rp:1, rt:1, rtc:1,
    // Media / Source elements:
    script:1, style:1, img:1, video:1, audio:1, canvas:1, svg:1, map:1, object:1,
    // Input elements
    input:1, textarea:1, select:1, option:1, optgroup:1, button:1,
    // Table related elements:
    table:1, tbody:1, thead:1, th:1, tr:1, td:1, caption:1, col:1, tfoot:1, colgroup:1
};

function replaceInText(element) {
    if (NON_PROSE_ELEMENTS[element.tagName?.toLowerCase()]) {
        return false;
    }
    let validChildren = true;
    for (let node of element.childNodes) {
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                validChildren = replaceInText(node) && validChildren;
                break;
            case Node.TEXT_NODE:
                replaceInTextNode(node);
                break;
            case Node.DOCUMENT_NODE:
                validChildren = replaceInText(node) && validChildren;
        }
    }
    if (validChildren) {
        replaceInTextNode(element);
    }
    return !NON_CONTIGUOUS_PROSE_ELEMENTS[element.tagName?.toLowerCase()] && validChildren;
}

async function startReplace(storage) {
    Object.assign(options, storage.options);
    Object.assign(prices, storage.prices);
    if (conversionsDisabled()) {
        return;
    }
    chrome.runtime.sendMessage({ updateBadge: true }, function () { });
    replaceAndObserve(document);
}

function start() {
    chrome.storage.sync.get(null, startReplace);
}

function handleMutations(mutations) {
    for (const mutation of mutations) {
        if (mutation.type === "characterData") {
            replaceInTextNode(mutation.target);
        }
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            replaceInText(mutation.target);
        }
    }
}

function replaceAndObserve(document) {
    replaceInText(document.body);
    observe(handleMutations, document.body, { childList: true, subtree: true, characterData: true });
}

let observer = undefined;
function observe(callback, element, options) {
    observer = new MutationObserver(callback);
    observer.observe(element, options);
}

const replacerFunction = function (...params) {
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
};

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
    let formattedResult = options.conversionFormat.replace('{amount}', result);
    return formattedResult.replace('{suffix}', groups.amountPostfix || '');
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
    observer.disconnect();
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