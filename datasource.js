const redemptionPriceEndpoint = 'https://subgraph.reflexer.finance/subgraphs/name/reflexer-labs/rai';
const redemptionPriceQuery = `
    query {
        systemState (id: "current") {
            currentRedemptionPrice {
                timestamp
                value
            }
            currentRedemptionRate {
                annualizedRate
            }
        }
    }`;
const marketPriceEndpoint = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
const marketPriceQuery = `
    query pools {
    pools(where: {id_in: ["0xcb0c5d9d92f4f2f80cce7aa271a1e148c226e19d"]}, orderBy: totalValueLockedUSD, orderDirection: desc, subgraphError: allow) {
        id
        feeTier
        liquidity
        sqrtPrice
        tick
        token0 {
            id
            symbol 
            name
            decimals
            derivedETH
        }
        token1 {
            id
            symbol 
            name
            decimals
            derivedETH
        }
        token0Price
        token1Price
        volumeUSD
        txCount
        totalValueLockedToken0
        totalValueLockedToken1
        totalValueLockedUSD
    }
    }
    `;

async function getPrices() {
    const responseArray = await Promise.all([
        fetchPromise(redemptionPriceEndpoint, redemptionPriceQuery), 
        fetchPromise(marketPriceEndpoint, marketPriceQuery)
    ]);
    return updateCache(responseArray);
}

function fetchPromise(url, query) {
	return fetch(url, {
		method: 'post',
		headers: {
		 'Accept': 'application/json',
		 'Content-Type': 'application/json',
		},
		body: JSON.stringify({ query: query}),
	}).then(response => response.json());
}

function updateCache(responseArray) {
    const prices = new Prices(responseArray, Date.now());
	chrome.storage.sync.set({prices: prices});
    return prices;
}

class Prices {
    constructor(responseArray, lastUpdate) {
      this.responseArray = responseArray;
      this.redemptionPrice = parseFloat(responseArray[0].data.systemState.currentRedemptionPrice.value);
      this.redemptionRate = parseFloat(responseArray[0].data.systemState.currentRedemptionRate.annualizedRate);
      this.marketPriceRaiInDai = parseFloat(responseArray[1].data.pools[0].token1Price);
      this.marketPriceDaiInRai = parseFloat(responseArray[1].data.pools[0].token0Price);
      this.lastUpdate = lastUpdate;
    }
  } 