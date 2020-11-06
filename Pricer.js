const Deribit = require('./Deribit');
const Opyn = require('./Opyn');

const DERIBIT_TAKER_FEE = process.env.DERIBIT_TAKER_FEE || 0.03;
const SPREAD_TO_DERIBIT = process.env.SPREAD_TO_DERIBIT || 0;

class Pricer {
    static async getEthOptionPrices() {
        let bids = [];
        let asks = [];

        const ethOptions = await Opyn.Opyn.getEthOptions();

        for (let ethOption of ethOptions) {
            const {optionExpiry, strikePrice, type} = ethOption;

            const orderBook = await Deribit.Deribit.getOrderBook("ETH", optionExpiry, strikePrice, type);

            const bidsForOption = Pricer.getBids(orderBook, ethOption);
            bids = bids.concat(bidsForOption);

            const asksForOption = Pricer.getAsks(orderBook, ethOption);
            asks = asks.concat(asksForOption);
        }

        return {
            bids,
            asks,
        };
    }

    static getBids(orderBook, ethOption) {
        const {underlying_price, bids: deribitBids} = orderBook;
        const bidScalingFactor = (1 - (DERIBIT_TAKER_FEE * underlying_price) - SPREAD_TO_DERIBIT);

        const bids = [];

        for (let bid of deribitBids) {
            const [price, amount] = bid;

            const newPrice = price * bidScalingFactor;

            const details = {
                price: newPrice,
                amount,
                ...ethOption
            };

            if (Pricer.shouldCreateBid(details)) {
                bids.push(details);
            }
        }

        return bids;
    }

    static shouldCreateBid(bidDetails) {
        //TODO: validate we want to make this bid (we have enough capital to buy this amount, the risk profile fits, etc)
        return true;
    }

    static getAsks(orderBook, ethOption) {
        const {underlying_price, asks: deribitAsks} = orderBook;
        const askScalingFactor = (1 + (DERIBIT_TAKER_FEE*underlying_price) + SPREAD_TO_DERIBIT);

        const asks = [];

        for (let ask of deribitAsks) {
            const [price, amount] = ask;

            const newPrice = price * askScalingFactor;

            const details = {
                price: newPrice,
                amount,
                ...ethOption
            };

            if (Pricer.shouldCreateAsk(details)) {
                asks.push(details);
            }
        }

        return asks;
    }

    static shouldCreateAsk(askDetails) {
        //TODO: validate we want to make this bid (we have enough collateral to mint this amount of options, the risk profile fits, etc)
        return true;
    }
}

exports.Pricer = Pricer;
