const Opyn = require('./Opyn');
const moment = require("moment");
const axios = require("axios");

const BASE_URL = "https://www.deribit.com/api/v2/";

class Deribit {
    static async get(url, params) {
        return axios({
            method: 'get',
            baseURL: BASE_URL,
            url,
            params
        });
    }

    static getInstrumentName(asset, expiryTimestamp, strikePrice, optionType) {
        const expiryMoment = moment.unix(expiryTimestamp);
        const day = expiryMoment.format("D");
        const month = expiryMoment.format("MMM");
        const year = expiryMoment.format("YY");

        return `${asset}-${day}${month.toUpperCase()}${year}-${strikePrice}-${optionType === Opyn.TYPES.PUT ? "P" : "C"}`;
    }

    //TODO: rather than querying the Deribit API each time,
    // update this function to query to the locally-maintained order book
    // which will be updated by websocket notifications from Deribit
    static async getOrderBook(asset, expiryTimestamp, strikePrice, optionType) {
        const SUB_URL = "public/get_order_book";
        const params = {
            instrument_name: Deribit.getInstrumentName(asset, expiryTimestamp, strikePrice, optionType),
            depth: 100
        };

        const response = await Deribit.get(SUB_URL, params);

        return response && response.data && response && response.data.result;
    }

    static async getOptionBookSummary(asset, expiryTimestamp, strikePrice, optionType) {
        const SUB_URL = "public/get_book_summary_by_instrument";
        const params = {
            instrument_name: Deribit.getInstrumentName(asset, expiryTimestamp, strikePrice, optionType),
        };
        const response = await Deribit.get(SUB_URL, params);

        return response && response.data && response.data.result.length && response.data.result[0];
    }
}

exports.Deribit = Deribit;

