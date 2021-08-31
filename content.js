const regex = /(?:(?:USD\s|(?:(?<![a-z])US\s?)?\$(?:\s?USD?)?|US\sDollars?)\s?((?:(?:\d{1,3}){1})(?:(?:\,\d{3}|\d)*)(?:\.\d+)?)(?:\s?(k|mm?|b|t)(?![a-z]))?(?:\s?(?:USD?))?)|(?:((?:(?:\d{1,3}){1})(?:(?:\,\d{3}|\d)*)(?:\.\d+)?)(?:\s?(k|mm?|b|t)(?![a-z]))?(?:\s?(\$(?:(?![a-z])(?:\s?US))|(?:US\s)?Dollars?|\s*USD?\$?(?![a-z]))))/i
const globalRegex = /(?:(?:USD\s|(?:(?<![a-z])US\s?)?\$(?:\s?USD?)?|US\sDollars?)\s?((?:(?:\d{1,3}){1})(?:(?:\,\d{3}|\d)*)(?:\.\d+)?)(?:\s?(k|mm?|b|t)(?![a-z]))?(?:\s?(?:USD?))?)|(?:((?:(?:\d{1,3}){1})(?:(?:\,\d{3}|\d)*)(?:\.\d+)?)(?:\s?(k|mm?|b|t)(?![a-z]))?(?:\s?(\$(?:(?![a-z])(?:\s?US))|(?:US\s)?Dollars?|\s*USD?\$?(?![a-z]))))/ig

const shadow = `green 2px 0px 2px, green -2px 0px 2px, green 4px 0px 6px, green -4px 0px 6px`;
const elementMap = new Map();
const options = {};

let highlightEnabled = true;

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
    if (!elementMap.has(node)) {
        elementMap.set(node, {});
    }
    let elementData = elementMap.get(node);
    elementData.originalText = node.textContent;
    let newText = node.textContent.replace(globalRegex, replacerFunction);
    if (newText !== node.textContent) {
        node.textContent = newText;
        elementData.newText = node.textContent;
    }
    if (!elementData.hasObserver) {
        elementData.hasObserver = true;
        observe((mutations) => {
            for (const mutation of mutations) {
                if (mutation.target.data.match(regex)) {
                    replaceInTextNode(node, replacerFunction);
                }
            }
        }, node, { characterData: true });
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
    if (element.textContent.match(regex)) {
        replaceInTextNode(element, replacerFunction);
    }
}

function getConversionPrice(prices, useRedemptionPrice) {
    if (useRedemptionPrice) {
        return prices.redemptionPrice;
    }
    return prices.marketPriceRaiInDai;
}

async function getCachedPrice(storage) {
    if (!storage.prices) {
        return getConversionPrice(await getPrices(), storage.options.useRedemptionPrice)
    }
    return getConversionPrice(storage.prices, storage.options.useRedemptionPrice)
}

async function startReplace(storage) {
    Object.assign(options, storage.options);
    if (options.blacklist[window.location.hostname] || !options.conversionEnabled) {
        return;
    }
    const price = await getCachedPrice(storage);
    chrome.runtime.sendMessage({ updateBadge: true }, function () { });
    const replacerFunction = getReplacerFunction(price);
    replaceAndObserve(document, replacerFunction);
}

function start() {
    chrome.storage.sync.get(null, startReplace);
}

function replaceAndObserve(document, replacerFunction) {
    replaceInText(document.body, replacerFunction);
    observe((mutations) => {
        for (const mutation of mutations) {
            for (const addedNode of mutation.addedNodes) {
                replaceInText(addedNode, replacerFunction);
            }
        }
    }, document.body, { childList: true, subtree: true });
}

function observe(callback, element, options) {
    const observer = new MutationObserver(callback);
    observer.observe(element, options);
}

function getReplacerFunction(price) {
    return function (match, p1, p2, p3, p4) {
        let result = captureConversion(p1, p2, price);
        if (result) {
            return result;
        }
        return captureConversion(p3, p4, price);
    }
}

function captureConversion(numCapture, postfixCapture, price) {
    if (numCapture && typeof parseFloat(numCapture) === 'number') {
        const num = parseFloat(numCapture.replace(/,/g, '')) / price;
        let postfix = '';
        if (postfixCapture) {
            postfix = postfixCapture;
        }
        return num.toLocaleString(undefined,
            { minimumFractionDigits: options.digits, maximumFractionDigits: options.digits }) + postfix + ' RAI';
    }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!request.requestPriceUpdate) {
        return;
    }
    getPrices();
});

//TODO: use this storage listener to apply options like disable/enable conversion to the page in real time
chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (!changes.options) {
        return;
    }

    Object.assign(options, changes.options.newValue);
    //assign storage
    let f = startReplace;
    if (elementMap.size > 0) {
        //rerender
        return;
    }
});

start();


