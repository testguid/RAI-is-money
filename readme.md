# RAI is money

This is a chrome extension offering real time USD -> RAI currency conversion and replacement on the page.  

Learn more about RAI at https://reflexer.finance/

## Dependencies
None! Pure JS.

Any Chromium based browser is supported.

## Installation
### Store - currently version 0.1
Add from the [chrome web store listing.](https://chrome.google.com/webstore/detail/rai-is-money/efedgnjpkdppihmkeapeloadceipmjfb)

### Manual Installation - currently version 0.2
- [download the repository](https://github.com/testguid/RAI-is-money/archive/refs/heads/main.zip)
- extract
- navigate to chrome://extensions/ or edge://extensions/
  - enable developer mode
  - load unpacked and point to the extension folder ex: \downloads\RAI is money 

## Release Notes
### 0.1
Initial commit.

### 0.2
Better initial experience for the badge price (it will appear after first page load rather than after 30 minutes or extension menu interaction).

## Features and Examples
- USD -> RAI conversion
    - Document traversal and observation to catch every relevant price.
      - watches all text nodes and reacts to any changes
      - watches nodes newly added to the document - example [zapper](https://zapper.fi/dashboard) or scrolling through a comments section
      - is able to convert values which span multiple nodes - example [daistats](https://daistats.com/#/oracles) 
   - Robust regex which matches many common and uncommon cases.
      - US $1 - example [ebay](https://www.ebay.com/itm/203174246738)
      - suffixes like $100k, 100k USD, $22m - example [uniswap](https://info.uniswap.org/home#/pools/0xcb0c5d9d92f4f2f80cce7aa271a1e148c226e19d)
      - will not get triggered by near matches like USDC, USDT
      - supports dollar signs or indicators before or after the amount
      - easily disabled if it ends up causing issues on the page


- Extension badge always shows the RAI price. Updates every 30 minutes.
  - The RAI price is cached so conversion begins as soon as the page loads in - no request latency.


- Open the extension menu for easy access to options.
  - Select between redemption price or uni v3 rai/dai price.
  - Disable conversion for the current site or all sites.
  - More settings for highlight, badge price, conversion digits.

![alt text](screenshot.PNG)
