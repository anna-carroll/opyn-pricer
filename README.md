# Pricer

## How To Run

Install dependencies:
```
$ npm i
```

### To generate a list of bids and asks

```
$ node index.js
```

**Add the following keys to your `.env` file**

```
DERIBIT_TAKER_FEE=[% trading fee]
SPREAD_TO_DERIBIT=[% spread to take from deribit price (can be positive, negative, or zero depending on if you want to make money, lose money or breakeven)]
WEB3_URL=[web3 provider key - e.g. Alchemy or Infura]
```
