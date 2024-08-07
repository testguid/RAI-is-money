const redemptionPriceEndpoint = 'https://gateway-arbitrum.network.thegraph.com/api/a560616a2b19516ba0775c2e5f0aaa45/subgraphs/id/ENRiqhB9eVqXPzNomBf5ryMpgot4neuAcTj69qFaznsM';
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

const marketPriceEndpoint = 'https://gateway-arbitrum.network.thegraph.com/api/856d71984af92a48a778ba427f977f5c/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV';
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
  }`;

  const vs_currencies = ['usd', 'eur', 'gbp', 'cny', 'jpy', 'krw', 'inr'];
  const coingeckoIds = ['usd-coin','dai','nusd','terrausd','tether','paxos-standard','binance-usd','liquity-usd','float-protocol-float'];
  const displayNames = {
      usd: 'USD',
      eur: 'EUR',
      gbp: 'GBP',
      cny: 'CNY',
      jpy: 'JPY',
      krw: 'KRW',
      inr: 'INR',
      'usd-coin': 'USDC',
      dai: 'DAI',
      tether: 'USDT',
      nusd: 'sUSD',
      terrausd: 'UST',
      'paxos-standard': 'PAX',
      'binance-usd': 'BUSD',
      'liquity-usd': 'LUSD',
      'float-protocol-float': 'FLOAT'
  };
  const coingeckoEndpoint = `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds.join(',')}&vs_currencies=${vs_currencies.join(',')}`;

async function getPrices() {
    const responseArray = await Promise.allSettled([
        fetchPromise(redemptionPriceEndpoint, getGqlQuery({ query: redemptionPriceQuery })),
        fetchPromise(marketPriceEndpoint, getGqlQuery({ query: marketPriceQuery })),
        fetchPromise(coingeckoEndpoint, getCoingeckoQuery())
    ]);
    console.log(responseArray)
    return updateCache(responseArray);
}

function getGqlQuery(query) {
    return {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
    }
}

function getCoingeckoQuery() {
    return {
        method: 'get',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    }
}

function fetchPromise(url, query) {
    return fetch(url, query).then(response => response.json());
}

function updateCache(responseArray) {
    const prices = new Prices(responseArray, Date.now());
    chrome.storage.local.set({ prices: prices });
    return prices;
}

class Prices {
    constructor(responseArray, lastUpdate) {
        this.responseArray = responseArray;
        this.redemptionPrice = parseFloat(responseArray[0].value?.data.systemState.currentRedemptionPrice.value);
        this.redemptionRate = parseFloat(responseArray[0].value?.data.systemState.currentRedemptionRate.annualizedRate);
        this.marketPriceRaiInDai = parseFloat(responseArray[1].value?.data.pools[0].token1Price);
        this.marketPriceDaiInRai = parseFloat(responseArray[1].value?.data.pools[0].token0Price);
        this.priceDivisors = new Object();
        for (const id of vs_currencies.concat(coingeckoIds)) {
            this.priceDivisors[id] = this.getPriceDivisor(id);
        }
        this.lastUpdate = lastUpdate;
    }

    getPriceDivisor(id) {
        if (id === 'usd' || id === 'dai') {
            return this.marketPriceRaiInDai;
        }
        if (vs_currencies.includes(id)) {
            return this.marketPriceRaiInDai * this.responseArray[2].value['dai'][id];
        }
        if (coingeckoIds.includes(id)) {
            return this.marketPriceRaiInDai / (this.responseArray[2].value['dai']['usd'] * this.responseArray[2].value[id]['usd']);
        }
        console.log(`no data for price type ${id}`);
    }
}